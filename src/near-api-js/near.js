import BN from 'bn.js';
import { Account } from './account';
import { Connection } from './connection';
import { Contract } from './contract';
import { readKeyFile } from './key_stores/unencrypted_file_system_keystore';
import { LocalAccountCreator, UrlAccountCreator } from './account_creator';
import { InMemoryKeyStore, MergeKeyStore } from './key_stores';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

export class Near {
    constructor(config) {
        this.config = config;
        this.connection = Connection.fromConfig({
            networkId: config.networkId,
            provider: { type: 'JsonRpcProvider', args: { url: config.nodeUrl } },
            signer: config.signer || { type: 'InMemorySigner', keyStore: config.keyStore || config.deps.keyStore }
        });
        if (config.masterAccount) {
            // TODO: figure out better way of specifiying initial balance.
            // Hardcoded number below must be enough to pay the gas cost to dev-deploy with near-shell for multiple times
            const initialBalance = config.initialBalance ? new BN(config.initialBalance) : new BN('500000000000000000000000000');
            this.accountCreator = new LocalAccountCreator(new Account(this.connection, config.masterAccount), initialBalance);
        }
        else if (config.helperUrl) {
            this.accountCreator = new UrlAccountCreator(this.connection, config.helperUrl);
        }
        else {
            this.accountCreator = null;
        }
    }
    /**
     *
     * @param accountId near accountId used to interact with the network.
     */
    account(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = new Account(this.connection, accountId);
            yield account.state();
            return account;
        });
    }
    /**
     *
     * @param accountId
     * @param publicKey
     */
    createAccount(accountId, publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.accountCreator) {
                throw new Error('Must specify account creator, either via masterAccount or helperUrl configuration settings.');
            }
            yield this.accountCreator.createAccount(accountId, publicKey);
            return new Account(this.connection, accountId);
        });
    }
    /**
     * @deprecated Use `new nearApi.Contract(yourAccount, contractId, { viewMethods, changeMethods })` instead.
     * @param contractId
     * @param options
     */
    loadContract(contractId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = new Account(this.connection, options.sender);
            return new Contract(account, contractId, options);
        });
    }
    /**
     * @deprecated Use `yourAccount.sendMoney` instead.
     * @param amount
     * @param originator
     * @param receiver
     */
    sendTokens(amount, originator, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            console.warn('near.sendTokens is deprecated. Use `yourAccount.sendMoney` instead.');
            const account = new Account(this.connection, originator);
            const result = yield account.sendMoney(receiver, amount);
            return result.transaction_outcome.id;
        });
    }
}
/**
 * Initialize connection to Near network.
 */
export function connect(config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Try to find extra key in `KeyPath` if provided.
        if (config.keyPath && config.deps && config.deps.keyStore) {
            try {
                const accountKeyFile = yield readKeyFile(config.keyPath);
                if (accountKeyFile[0]) {
                    // TODO: Only load key if network ID matches
                    const keyPair = accountKeyFile[1];
                    const keyPathStore = new InMemoryKeyStore();
                    yield keyPathStore.setKey(config.networkId, accountKeyFile[0], keyPair);
                    if (!config.masterAccount) {
                        config.masterAccount = accountKeyFile[0];
                    }
                    config.deps.keyStore = new MergeKeyStore([config.deps.keyStore, keyPathStore]);
                    console.log(`Loaded master account ${accountKeyFile[0]} key from ${config.keyPath} with public key = ${keyPair.getPublicKey()}`);
                }
            }
            catch (error) {
                console.warn(`Failed to load master account key from ${config.keyPath}: ${error}`);
            }
        }
        return new Near(config);
    });
}
