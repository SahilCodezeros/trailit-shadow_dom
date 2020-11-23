const { KeyPair } = require('../near-api-js/common-index.js');
// const URL = require('url').URL;

const config = require('./config.json');

const keyPair = KeyPair.fromRandom('ed25519');
const publicKey = keyPair.getPublicKey().toString();

console.log(`This should be saved to storage: ${keyPair.toString()}`);

export function keyPairGenerate() {
    // const url = new URL(`${config.walletUrl}/login/`);
    // url.searchParams.set('title', 'Trailit');
    // url.searchParams.set('public_key', publicKey);
    // url.searchParams.set('success_url', 'http://127.0.0.1:5000');
    // console.log(`Navigate to ${url.toString()} to authorize the above keypair`);
    return keyPair.toString();
};

// const url = new URL(`${config.walletUrl}/login/`);
// url.searchParams.set('title', 'Trailit');
// url.searchParams.set('public_key', publicKey);
// url.searchParams.set('success_url', 'http://127.0.0.1:5000');
// console.log(`Navigate to ${url.toString()} to authorize the above keypair`);