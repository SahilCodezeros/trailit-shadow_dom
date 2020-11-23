import { KeyStore } from './keystore';

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

/**
 * Keystore which can be used to merge multiple key stores into one virtual key store.
 */
export class MergeKeyStore extends KeyStore {
    /**
     * @param keyStores first keystore gets all write calls, read calls are attempted from start to end of array
     */
    constructor(keyStores) {
        super();
        this.keyStores = keyStores;
    }
    /**
     * Sets a storage item to the first index of a key store array
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @param keyPair The key pair to store in local storage
     */
    setKey(networkId, accountId, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.keyStores[0].setKey(networkId, accountId, keyPair);
        });
    }
    /**
     * Gets a key from the array of key stores
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @returns {Promise<KeyPair>}
     */
    getKey(networkId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const keyStore of this.keyStores) {
                const keyPair = yield keyStore.getKey(networkId, accountId);
                if (keyPair) {
                    return keyPair;
                }
            }
            return null;
        });
    }
    /**
     * Removes a key from the array of key stores
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     */
    removeKey(networkId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const keyStore of this.keyStores) {
                yield keyStore.removeKey(networkId, accountId);
            }
        });
    }
    /**
     * Removes all items from each key store
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const keyStore of this.keyStores) {
                yield keyStore.clear();
            }
        });
    }
    /**
     * Get the network(s) from the array of key stores
     * @returns {Promise<string[]>}
     */
    getNetworks() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Set();
            for (const keyStore of this.keyStores) {
                for (const network of yield keyStore.getNetworks()) {
                    result.add(network);
                }
            }
            return Array.from(result);
        });
    }
    /**
     * Gets the account(s) from the array of key stores
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns{Promise<string[]>}
     */
    getAccounts(networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Set();
            for (const keyStore of this.keyStores) {
                for (const account of yield keyStore.getAccounts(networkId)) {
                    result.add(account);
                }
            }
            return Array.from(result);
        });
    }
    toString() {
        return `MergeKeyStore(${this.keyStores.join(', ')})`;
    }
}
