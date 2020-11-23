import BN from 'bn.js';
import { Account } from './account';
import { Contract } from './contract';
import { parseNearAmount } from './utils/format';
import { PublicKey } from './utils/key_pair';
import { addKey, deleteKey, deployContract, functionCall, functionCallAccessKey } from './transaction';
import { fetchJson } from './utils/web';

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

const NETWORK_ID = process.env.REACT_APP_NETWORK_ID || 'default';
const CONTRACT_HELPER_URL = process.env.CONTRACT_HELPER_URL || 'https://helper.testnet.near.org';
export const MULTISIG_STORAGE_KEY = '__multisigRequest';
export const MULTISIG_ALLOWANCE = new BN(process.env.MULTISIG_ALLOWANCE || parseNearAmount('1'));
export const MULTISIG_GAS = new BN(process.env.MULTISIG_GAS || '100000000000000');
export const MULTISIG_DEPOSIT = new BN('0');
export const MULTISIG_CHANGE_METHODS = ['add_request', 'add_request_and_confirm', 'delete_request', 'confirm'];
export const MULTISIG_VIEW_METHODS = ['get_request_nonce', 'list_request_ids'];
export const MULTISIG_CONFIRM_METHODS = ['confirm'];
;
// in memory request cache for node w/o localStorage
let storageFallback = {
    [MULTISIG_STORAGE_KEY]: null
};
export class AccountMultisig extends Account {
    constructor(connection, accountId, storage) {
        super(connection, accountId);
        this.storage = storage;
        this.contract = getContract(this);
    }
    addKey(publicKey, contractId, methodName, amount) {
        const _super = Object.create(null, {
            addKey: { get: () => super.addKey }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (contractId) {
                return _super.addKey.call(this, publicKey, contractId, MULTISIG_CHANGE_METHODS.join(), MULTISIG_ALLOWANCE);
            }
            return _super.addKey.call(this, publicKey);
        });
    }
    signAndSendTransaction(receiverId, actions) {
        const _super = Object.create(null, {
            signAndSendTransaction: { get: () => super.signAndSendTransaction }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { accountId } = this;
            if (this.isDeleteAction(actions)) {
                return yield _super.signAndSendTransaction.call(this, accountId, actions);
            }
            yield this.deleteUnconfirmedRequests();
            const requestId = yield this.getRequestNonce();
            this.setRequest({ accountId, requestId, actions });
            const args = new Uint8Array(new TextEncoder().encode(JSON.stringify({
                request: {
                    receiver_id: receiverId,
                    actions: convertActions(actions, accountId, receiverId)
                }
            })));
            return yield _super.signAndSendTransaction.call(this, accountId, [
                functionCall('add_request_and_confirm', args, MULTISIG_GAS, MULTISIG_DEPOSIT)
            ]);
        });
    }
    signAndSendTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let { receiverId, actions } of transactions) {
                yield this.signAndSendTransaction(receiverId, actions);
            }
        });
    }
    deployMultisig(contractBytes) {
        const _super = Object.create(null, {
            signAndSendTransaction: { get: () => super.signAndSendTransaction }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { accountId } = this;
            // replace account keys & recovery keys with limited access keys; DO NOT replace seed phrase keys
            const accountKeys = (yield this.getAccessKeys()).map((ak) => ak.public_key);
            const seedPhraseKeys = (yield this.getRecoveryMethods()).data
                .filter(({ kind, publicKey }) => kind === 'phrase' && publicKey !== null && accountKeys.includes(publicKey))
                .map((rm) => rm.publicKey);
            const fak2lak = accountKeys.filter((k) => !seedPhraseKeys.includes(k)).map(toPK);
            const confirmOnlyKey = toPK((yield this.postSignedJson('/2fa/getAccessKey', { accountId })).publicKey);
            const newArgs = new Uint8Array(new TextEncoder().encode(JSON.stringify({ 'num_confirmations': 2 })));
            const actions = [
                ...fak2lak.map((pk) => deleteKey(pk)),
                ...fak2lak.map((pk) => addKey(pk, functionCallAccessKey(accountId, MULTISIG_CHANGE_METHODS, null))),
                addKey(confirmOnlyKey, functionCallAccessKey(accountId, MULTISIG_CONFIRM_METHODS, null)),
                deployContract(contractBytes),
                functionCall('new', newArgs, MULTISIG_GAS, MULTISIG_DEPOSIT),
            ];
            console.log('deploying multisig contract for', accountId);
            return yield _super.signAndSendTransaction.call(this, accountId, actions);
        });
    }
    deleteUnconfirmedRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            const { contract } = this;
            const request_ids = yield this.getRequestIds();
            for (const request_id of request_ids) {
                try {
                    yield contract.delete_request({ request_id });
                }
                catch (e) {
                    console.warn("Attempt to delete an earlier request before 15 minutes failed. Will try again.");
                }
            }
        });
    }
    // helpers
    getRequestNonce() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.get_request_nonce();
        });
    }
    getRequestIds() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.list_request_ids();
        });
    }
    isDeleteAction(actions) {
        return actions && actions[0] && actions[0].functionCall && actions[0].functionCall.methodName === 'delete_request';
    }
    getRequest() {
        if (this.storage) {
            return JSON.parse(this.storage.getItem(MULTISIG_STORAGE_KEY) || `{}`);
        }
        return storageFallback[MULTISIG_STORAGE_KEY];
    }
    setRequest(data) {
        if (this.storage) {
            return this.storage.setItem(MULTISIG_STORAGE_KEY, JSON.stringify(data));
        }
        storageFallback[MULTISIG_STORAGE_KEY] = data;
    }
    // default helpers for CH
    sendRequestCode() {
        return __awaiter(this, void 0, void 0, function* () {
            const { accountId } = this;
            const { requestId, actions } = this.getRequest();
            if (this.isDeleteAction(actions)) {
                return;
            }
            const method = yield this.get2faMethod();
            yield this.postSignedJson('/2fa/send', {
                accountId,
                method,
                requestId,
            });
            return requestId;
        });
    }
    verifyRequestCode(securityCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const { accountId } = this;
            const request = this.getRequest();
            if (!request) {
                throw new Error('no request pending');
            }
            const { requestId } = request;
            return yield this.postSignedJson('/2fa/verify', {
                accountId,
                securityCode,
                requestId
            });
        });
    }
    getRecoveryMethods() {
        return __awaiter(this, void 0, void 0, function* () {
            const { accountId } = this;
            return {
                accountId,
                data: yield this.postSignedJson('/account/recoveryMethods', { accountId })
            };
        });
    }
    get2faMethod() {
        return __awaiter(this, void 0, void 0, function* () {
            let { data } = yield this.getRecoveryMethods();
            if (data && data.length) {
                data = data.find((m) => m.kind.indexOf('2fa-') === 0);
            }
            if (!data)
                return null;
            const { kind, detail } = data;
            return { kind, detail };
        });
    }
    signatureFor() {
        return __awaiter(this, void 0, void 0, function* () {
            const { accountId } = this;
            const blockNumber = String((yield this.connection.provider.status()).sync_info.latest_block_height);
            const signed = yield this.connection.signer.signMessage(Buffer.from(blockNumber), accountId, NETWORK_ID);
            const blockNumberSignature = Buffer.from(signed.signature).toString('base64');
            return { blockNumber, blockNumberSignature };
        });
    }
    postSignedJson(path, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetchJson(CONTRACT_HELPER_URL + path, JSON.stringify(Object.assign(Object.assign({}, body), (yield this.signatureFor()))));
        });
    }
}
// helpers
const toPK = (pk) => PublicKey.from(pk);
const convertPKForContract = (pk) => pk.toString().replace('ed25519:', '');
const getContract = (account) => {
    return new Contract(account, account.accountId, {
        viewMethods: MULTISIG_VIEW_METHODS,
        changeMethods: MULTISIG_CHANGE_METHODS,
    });
};
const convertActions = (actions, accountId, receiverId) => actions.map((a) => {
    const type = a.enum;
    const { gas, publicKey, methodName, args, deposit, accessKey, code } = a[type];
    const action = {
        type: type[0].toUpperCase() + type.substr(1),
        gas: (gas && gas.toString()) || undefined,
        public_key: (publicKey && convertPKForContract(publicKey)) || undefined,
        method_name: methodName,
        args: (args && Buffer.from(args).toString('base64')) || undefined,
        code: (code && Buffer.from(code).toString('base64')) || undefined,
        amount: (deposit && deposit.toString()) || undefined,
        deposit: (deposit && deposit.toString()) || '0',
        permission: undefined,
    };
    if (accessKey) {
        if (receiverId === accountId && accessKey.permission.enum !== 'fullAccess') {
            action.permission = {
                receiver_id: accountId,
                allowance: MULTISIG_ALLOWANCE.toString(),
                method_names: MULTISIG_CHANGE_METHODS,
            };
        }
        if (accessKey.permission.enum === 'functionCall') {
            const { receiverId: receiver_id, methodNames: method_names, allowance } = accessKey.permission.functionCall;
            action.permission = {
                receiver_id,
                allowance: (allowance && allowance.toString()) || undefined,
                method_names
            };
        }
    }
    return action;
});
