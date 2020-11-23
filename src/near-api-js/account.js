import BN from 'bn.js';
import { transfer, createAccount, signTransaction, deployContract, addKey, functionCall, fullAccessKey, functionCallAccessKey, deleteKey, stake, deleteAccount } from './transaction';
import { TypedError, ErrorContext } from './providers';
import { base_decode, base_encode } from './utils/serialize';
import { PublicKey } from './utils/key_pair';
import { PositionalArgsError } from './utils/errors';
import { parseRpcError } from './utils/rpc_errors';
import exponentialBackoff from './utils/exponential-backoff';

'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

// Default amount of gas to be sent with the function calls. Used to pay for the fees
// incurred while running the contract execution. The unused amount will be refunded back to
// the originator.
// Due to protocol changes that charge upfront for the maximum possible gas price inflation due to
// full blocks, the price of max_prepaid_gas is decreased to `300 * 10**12`.
// For discussion see https://github.com/nearprotocol/NEPs/issues/67
const DEFAULT_FUNC_CALL_GAS = new BN('30000000000000');
// Default number of retries with different nonce before giving up on a transaction.
const TX_NONCE_RETRY_NUMBER = 12;
// Default number of retries before giving up on a transaction.
const TX_STATUS_RETRY_NUMBER = 12;
// Default wait until next retry in millis.
const TX_STATUS_RETRY_WAIT = 500;
// Exponential back off for waiting to retry.
const TX_STATUS_RETRY_WAIT_BACKOFF = 1.5;
function parseJsonFromRawResponse(response) {
    return JSON.parse(Buffer.from(response).toString());
}
/**
 * More information on [the Account spec](https://nomicon.io/DataStructures/Account.html)
 */
export class Account {
    constructor(connection, accountId) {
        this.accessKeyByPublicKeyCache = {};
        this.connection = connection;
        this.accountId = accountId;
    }
    get ready() {
        return this._ready || (this._ready = Promise.resolve(this.fetchState()));
    }
    /**
     * Helper function when getting the state of a NEAR account
     * @returns Promise<void>
     */
    fetchState() {
        return __awaiter(this, void 0, void 0, function* () {
            this._state = yield this.connection.provider.query(`account/${this.accountId}`, '');
        });
    }
    /**
     * Returns the state of a NEAR account
     * @returns {Promise<AccountState>}
     */
    state() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready;
            return this._state;
        });
    }
    printLogsAndFailures(contractId, results) {
        for (const result of results) {
            console.log(`Receipt${result.receiptIds.length > 1 ? 's' : ''}: ${result.receiptIds.join(', ')}`);
            this.printLogs(contractId, result.logs, '\t');
            if (result.failure) {
                console.warn(`\tFailure [${contractId}]: ${result.failure}`);
            }
        }
    }
    printLogs(contractId, logs, prefix = '') {
        for (const log of logs) {
            console.log(`${prefix}Log [${contractId}]: ${log}`);
        }
    }
    signTransaction(receiverId, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready;
            const accessKeyInfo = yield this.findAccessKey(receiverId, actions);
            if (!accessKeyInfo) {
                throw new TypedError(`Can not sign transactions for account ${this.accountId} on network ${this.connection.networkId}, no matching key pair found in ${this.connection.signer}.`, 'KeyNotFound');
            }
            const { accessKey } = accessKeyInfo;
            const status = yield this.connection.provider.status();
            const nonce = ++accessKey.nonce;
            // TODO: get latest_block_hash from block query using `final` finality
            return yield signTransaction(receiverId, nonce, actions, base_decode(status.sync_info.latest_block_hash), this.connection.signer, this.accountId, this.connection.networkId);
        });
    }
    /**
     * @param receiverId NEAR account receiving the transaction
     * @param actions The transaction [Action as described in the spec](https://nomicon.io/RuntimeSpec/Actions.html).
     * @returns {Promise<FinalExecutionOutcome>}
     */
    signAndSendTransaction(receiverId, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready;
            let txHash, signedTx;
            // TODO: TX_NONCE (different constants for different uses of exponentialBackoff?)
            const result = yield exponentialBackoff(TX_STATUS_RETRY_WAIT, TX_NONCE_RETRY_NUMBER, TX_STATUS_RETRY_WAIT_BACKOFF, () => __awaiter(this, void 0, void 0, function* () {
                [txHash, signedTx] = yield this.signTransaction(receiverId, actions);
                const publicKey = signedTx.transaction.publicKey;
                try {
                    const result = yield exponentialBackoff(TX_STATUS_RETRY_WAIT, TX_STATUS_RETRY_NUMBER, TX_STATUS_RETRY_WAIT_BACKOFF, () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            return yield this.connection.provider.sendTransaction(signedTx);
                        }
                        catch (error) {
                            if (error.type === 'TimeoutError') {
                                console.warn(`Retrying transaction ${receiverId}:${base_encode(txHash)} as it has timed out`);
                                return null;
                            }
                            throw error;
                        }
                    }));
                    if (!result) {
                        throw new TypedError(`Exceeded ${TX_STATUS_RETRY_NUMBER} attempts for transaction ${base_encode(txHash)}.`, 'RetriesExceeded', new ErrorContext(base_encode(txHash)));
                    }
                    return result;
                }
                catch (error) {
                    if (error.message.match(/Transaction nonce \d+ must be larger than nonce of the used access key \d+/)) {
                        console.warn(`Retrying transaction ${receiverId}:${base_encode(txHash)} with new nonce.`);
                        delete this.accessKeyByPublicKeyCache[publicKey.toString()];
                        return null;
                    }
                    error.context = new ErrorContext(base_encode(txHash));
                    throw error;
                }
            }));
            if (!result) {
                throw new TypedError('nonce retries exceeded for transaction. This usually means there are too many parallel requests with the same access key.', 'RetriesExceeded');
            }
            const flatLogs = [result.transaction_outcome, ...result.receipts_outcome].reduce((acc, it) => {
                if (it.outcome.logs.length ||
                    (typeof it.outcome.status === 'object' && typeof it.outcome.status.Failure === 'object')) {
                    return acc.concat({
                        'receiptIds': it.outcome.receipt_ids,
                        'logs': it.outcome.logs,
                        'failure': typeof it.outcome.status.Failure != 'undefined' ? parseRpcError(it.outcome.status.Failure) : null
                    });
                }
                else
                    return acc;
            }, []);
            this.printLogsAndFailures(signedTx.transaction.receiverId, flatLogs);
            if (typeof result.status === 'object' && typeof result.status.Failure === 'object') {
                // if error data has error_message and error_type properties, we consider that node returned an error in the old format
                if (result.status.Failure.error_message && result.status.Failure.error_type) {
                    throw new TypedError(`Transaction ${result.transaction_outcome.id} failed. ${result.status.Failure.error_message}`, result.status.Failure.error_type);
                }
                else {
                    throw parseRpcError(result.status.Failure);
                }
            }
            // TODO: if Tx is Unknown or Started.
            return result;
        });
    }
    findAccessKey(receiverId, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Find matching access key based on transaction
            const publicKey = yield this.connection.signer.getPublicKey(this.accountId, this.connection.networkId);
            if (!publicKey) {
                return null;
            }
            const cachedAccessKey = this.accessKeyByPublicKeyCache[publicKey.toString()];
            if (cachedAccessKey !== undefined) {
                return { publicKey, accessKey: cachedAccessKey };
            }
            try {
                const accessKey = yield this.connection.provider.query(`access_key/${this.accountId}/${publicKey.toString()}`, '');
                this.accessKeyByPublicKeyCache[publicKey.toString()] = accessKey;
                return { publicKey, accessKey };
            }
            catch (e) {
                // TODO: Check based on .type when nearcore starts returning query errors in structured format
                if (e.message.includes('does not exist while viewing')) {
                    return null;
                }
                throw e;
            }
        });
    }
    /**
     * @param contractId NEAR account where the contract is deployed
     * @param publicKey The public key to add while signing and sending the transaction
     * @param data The compiled contract code
     * @returns {Promise<Account>}
     */
    createAndDeployContract(contractId, publicKey, data, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessKey = fullAccessKey();
            yield this.signAndSendTransaction(contractId, [createAccount(), transfer(amount), addKey(PublicKey.from(publicKey), accessKey), deployContract(data)]);
            const contractAccount = new Account(this.connection, contractId);
            return contractAccount;
        });
    }
    /**
     * @param receiverId NEAR account receiving Ⓝ
     * @param amount Amount to send in yoctoⓃ
     * @returns {Promise<FinalExecutionOutcome>}
     */
    sendMoney(receiverId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signAndSendTransaction(receiverId, [transfer(amount)]);
        });
    }
    /**
     * @param newAccountId NEAR account name to be created
     * @param publicKey A public key created from the masterAccount
     * @returns {Promise<FinalExecutionOutcome>}
     */
    createAccount(newAccountId, publicKey, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessKey = fullAccessKey();
            return this.signAndSendTransaction(newAccountId, [createAccount(), transfer(amount), addKey(PublicKey.from(publicKey), accessKey)]);
        });
    }
    /**
     * @param beneficiaryId The NEAR account that will receive the remaining Ⓝ balance from the account being deleted
     * @returns void
     */
    deleteAccount(beneficiaryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signAndSendTransaction(this.accountId, [deleteAccount(beneficiaryId)]);
        });
    }
    /**
     * @param data The compiled contract code
     * @returns {Promise<FinalExecutionOutcome>}
     */
    deployContract(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signAndSendTransaction(this.accountId, [deployContract(data)]);
        });
    }
    /**
     * @param contractId NEAR account where the contract is deployed
     * @param methodName The method name on the contract as it is written in the contract code
     * @param args arguments to pass to method. Can be either plain JS object which gets serialized as JSON automatically
     *  or `Uint8Array` instance which represents bytes passed as is.
     * @param gas max amount of gas that method call can use
      * @param deposit amount of NEAR (in yoctoNEAR) to send together with the call
     * @returns {Promise<FinalExecutionOutcome>}
     */
    functionCall(contractId, methodName, args, gas, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            args = args || {};
            this.validateArgs(args);
            return this.signAndSendTransaction(contractId, [functionCall(methodName, args, gas || DEFAULT_FUNC_CALL_GAS, amount)]);
        });
    }
    /**
     * @param publicKey A public key to be associated with the contract
     * @param contractId NEAR account where the contract is deployed
     * @param methodName The method name on the contract as it is written in the contract code
     * @param amount Payment in yoctoⓃ that is sent to the contract during this function call
     * @returns {Promise<FinalExecutionOutcome>}
     * TODO: expand this API to support more options.
     */
    addKey(publicKey, contractId, methodName, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            let accessKey;
            if (contractId === null || contractId === undefined || contractId === '') {
                accessKey = fullAccessKey();
            }
            else {
                accessKey = functionCallAccessKey(contractId, !methodName ? [] : [methodName], amount);
            }
            return this.signAndSendTransaction(this.accountId, [addKey(PublicKey.from(publicKey), accessKey)]);
        });
    }
    /**
     * @param publicKey The public key to be deleted
     * @returns {Promise<FinalExecutionOutcome>}
     */
    deleteKey(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signAndSendTransaction(this.accountId, [deleteKey(PublicKey.from(publicKey))]);
        });
    }
    /**
     * @param publicKey The public key for the account that's staking
     * @param amount The account to stake in yoctoⓃ
     * @returns {Promise<FinalExecutionOutcome>}
     */
    stake(publicKey, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signAndSendTransaction(this.accountId, [stake(amount, PublicKey.from(publicKey))]);
        });
    }
    validateArgs(args) {
        const isUint8Array = args.byteLength !== undefined && args.byteLength === args.length;
        if (isUint8Array) {
            return;
        }
        if (Array.isArray(args) || typeof args !== 'object') {
            throw new PositionalArgsError();
        }
    }
    /**
     * @param contractId NEAR account where the contract is deployed
     * @param methodName The view-only method (no state mutations) name on the contract as it is written in the contract code
     * @param args Any arguments to the view contract method, wrapped in JSON
     * @returns {Promise<any>}
     */
    viewFunction(contractId, methodName, args, { parse = parseJsonFromRawResponse } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            args = args || {};
            this.validateArgs(args);
            const result = yield this.connection.provider.query(`call/${contractId}/${methodName}`, base_encode(JSON.stringify(args)));
            if (result.logs) {
                this.printLogs(contractId, result.logs);
            }
            return result.result && result.result.length > 0 && parse(Buffer.from(result.result));
        });
    }
    /**
     * @returns array of {access_key: AccessKey, public_key: PublicKey} items.
     */
    getAccessKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.connection.provider.query(`access_key/${this.accountId}`, '');
            // A breaking API change introduced extra information into the
            // response, so it now returns an object with a `keys` field instead
            // of an array: https://github.com/nearprotocol/nearcore/pull/1789
            if (Array.isArray(response)) {
                return response;
            }
            return response.keys;
        });
    }
    /**
     * Returns account details in terms of authorized apps and transactions
     * @returns {Promise<any>}
     */
    getAccountDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: update the response value to return all the different keys, not just app keys.
            // Also if we need this function, or getAccessKeys is good enough.
            const accessKeys = yield this.getAccessKeys();
            const result = { authorizedApps: [], transactions: [] };
            accessKeys.map((item) => {
                if (item.access_key.permission.FunctionCall !== undefined) {
                    const perm = item.access_key.permission.FunctionCall;
                    result.authorizedApps.push({
                        contractId: perm.receiver_id,
                        amount: perm.allowance,
                        publicKey: item.public_key,
                    });
                }
            });
            return result;
        });
    }
    /**
     * Returns calculated account balance
     * @returns {Promise<AccountBalance>}
     */
    getAccountBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const genesisConfig = yield this.connection.provider.experimental_genesisConfig();
            const state = yield this.state();
            const costPerByte = new BN(genesisConfig.runtime_config.storage_amount_per_byte);
            const stateStaked = new BN(state.storage_usage).mul(costPerByte);
            const staked = new BN(state.locked);
            const totalBalance = new BN(state.amount).add(staked);
            const availableBalance = totalBalance.sub(BN.max(staked, stateStaked));
            return {
                total: totalBalance.toString(),
                stateStaked: stateStaked.toString(),
                staked: staked.toString(),
                available: availableBalance.toString()
            };
        });
    }
}
