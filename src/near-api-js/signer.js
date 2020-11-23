import sha256 from 'js-sha256';
import { KeyPair } from './utils/key_pair';

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
 * General signing interface, can be used for in memory signing, RPC singing, external wallet, HSM, etc.
 */
export class Signer {
}
/**
 * Signs using in memory key store.
 */
export class InMemorySigner extends Signer {
    constructor(keyStore) {
        super();
        this.keyStore = keyStore;
    }
    /**
     * Creates a public key for the account given
     * @param accountId The NEAR account to assign a public key to
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns {Promise<PublicKey>}
     */
    createKey(accountId, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPair = KeyPair.fromRandom('ed25519');
            yield this.keyStore.setKey(networkId, accountId, keyPair);
            return keyPair.getPublicKey();
        });
    }
    /**
     * Gets the existing public key for a given account
     * @param accountId The NEAR account to assign a public key to
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns {Promise<PublicKey>} Returns the public key or null if not found
     */
    getPublicKey(accountId, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPair = yield this.keyStore.getKey(networkId, accountId);
            if (keyPair === null) {
                return null;
            }
            return keyPair.getPublicKey();
        });
    }
    /**
     * @param message A message to be signed, typically a serialized transaction
     * @param accountId the NEAR account signing the message
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns {Promise<Signature>}
     */
    signMessage(message, accountId, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = new Uint8Array(sha256.sha256.array(message));
            if (!accountId) {
                throw new Error('InMemorySigner requires provided account id');
            }
            const keyPair = yield this.keyStore.getKey(networkId, accountId);
            if (keyPair === null) {
                throw new Error(`Key for ${accountId} not found in ${networkId}`);
            }
            return keyPair.sign(hash);
        });
    }
    toString() {
        return `InMemorySigner(${this.keyStore})`;
    }
}
