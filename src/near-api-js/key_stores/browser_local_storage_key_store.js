import { KeyStore } from './keystore';
import { KeyPair } from '../utils/key_pair';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const LOCAL_STORAGE_KEY_PREFIX = 'near-api-js:keystore:';
export class BrowserLocalStorageKeyStore extends KeyStore {
    constructor(localStorage = window.localStorage, prefix = LOCAL_STORAGE_KEY_PREFIX) {
        super();
        this.localStorage = localStorage;
        this.prefix = prefix;
    }
    /**
     * Sets a local storage item
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @param keyPair The key pair to store in local storage
     */
    setKey(networkId, accountId, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            this.localStorage.setItem(this.storageKeyForSecretKey(networkId, accountId), keyPair.toString());
        });
    }
    /**
     * Gets a key from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @returns {Promise<KeyPair>}
     */
    getKey(networkId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = this.localStorage.getItem(this.storageKeyForSecretKey(networkId, accountId));
            if (!value) {
                return null;
            }
            return KeyPair.fromString(value);
        });
    }
    /**
     * Removes a key from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     */
    removeKey(networkId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.localStorage.removeItem(this.storageKeyForSecretKey(networkId, accountId));
        });
    }
    /**
     * Removes all items from local storage
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of this.storageKeys()) {
                if (key.startsWith(this.prefix)) {
                    this.localStorage.removeItem(key);
                }
            }
        });
    }
    /**
     * Get the network(s) from local storage
     * @returns {Promise<string[]>}
     */
    getNetworks() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Set();
            for (const key of this.storageKeys()) {
                if (key.startsWith(this.prefix)) {
                    const parts = key.substring(this.prefix.length).split(':');
                    result.add(parts[1]);
                }
            }
            return Array.from(result.values());
        });
    }
    /**
     * Gets the account(s) from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns{Promise<string[]>}
     */
    getAccounts(networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Array();
            for (const key of this.storageKeys()) {
                if (key.startsWith(this.prefix)) {
                    const parts = key.substring(this.prefix.length).split(':');
                    if (parts[1] === networkId) {
                        result.push(parts[0]);
                    }
                }
            }
            return result;
        });
    }
    /**
     * Helper function to retrieve a local storage key
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the storage keythat's sought
     * @returns {string} An example might be: `near-api-js:keystore:near-friend:default`
     */
    storageKeyForSecretKey(networkId, accountId) {
        return `${this.prefix}${accountId}:${networkId}`;
    }
    *storageKeys() {
        for (let i = 0; i < this.localStorage.length; i++) {
            yield this.localStorage.key(i);
        }
    }
}
