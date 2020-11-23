import fs from 'fs';
import path from 'path';
import { promisify as _promisify } from 'util';
import { KeyPair } from '../utils/key_pair';
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

const promisify = (fn) => {
    if (!fn) {
        return () => {
            throw new Error('Trying to use unimplemented function. `fs` module not available in web build?');
        };
    }
    return _promisify(fn);
};

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

export function loadJsonFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = yield readFile(filename);
        return JSON.parse(content.toString());
    });
}

function ensureDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mkdir(dir, { recursive: true });
        }
        catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
    });
}

export function readKeyFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountInfo = yield loadJsonFile(filename);
        // The private key might be in private_key or secret_key field.
        let privateKey = accountInfo.private_key;
        if (!privateKey && accountInfo.secret_key) {
            privateKey = accountInfo.secret_key;
        }
        return [accountInfo.account_id, KeyPair.fromString(privateKey)];
    });
}

export class UnencryptedFileSystemKeyStore extends KeyStore {
    constructor(keyDir) {
        super();
        this.keyDir = path.resolve(keyDir);
    }
    /**
     * Sets a storage item in a file, unencrypted
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @param keyPair The key pair to store in local storage
     */
    setKey(networkId, accountId, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            yield ensureDir(`${this.keyDir}/${networkId}`);
            const content = { account_id: accountId, public_key: keyPair.getPublicKey().toString(), private_key: keyPair.toString() };
            yield writeFile(this.getKeyFilePath(networkId, accountId), JSON.stringify(content));
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
            // Find key / account id.
            if (!(yield exists(this.getKeyFilePath(networkId, accountId)))) {
                return null;
            }
            const accountKeyPair = yield readKeyFile(this.getKeyFilePath(networkId, accountId));
            return accountKeyPair[1];
        });
    }
    /**
     * Removes a key from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     */
    removeKey(networkId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield exists(this.getKeyFilePath(networkId, accountId))) {
                yield unlink(this.getKeyFilePath(networkId, accountId));
            }
        });
    }
    /**
     * Removes all items from local storage
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const network of yield this.getNetworks()) {
                for (const account of yield this.getAccounts(network)) {
                    yield this.removeKey(network, account);
                }
            }
        });
    }
    getKeyFilePath(networkId, accountId) {
        return `${this.keyDir}/${networkId}/${accountId}.json`;
    }
    /**
     * Get the network(s) from local storage
     * @returns {Promise<string[]>}
     */
    getNetworks() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield readdir(this.keyDir);
            const result = new Array();
            files.forEach((item) => {
                result.push(item);
            });
            return result;
        });
    }
    /**
     * Gets the account(s) from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns{Promise<string[]>}
     */
    getAccounts(networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield exists(`${this.keyDir}/${networkId}`))) {
                return [];
            }
            const files = yield readdir(`${this.keyDir}/${networkId}`);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace(/.json$/, ''));
        });
    }
    
    toString() {
        return `UnencryptedFileSystemKeyStore(${this.keyDir})`;
    }
}
