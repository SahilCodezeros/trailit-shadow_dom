const nearAPI = require('../near-api-js/common-index.js');
const config = require('./config.json');
// const account = 'testuser1.testnet';
const sender = '3piivr9bo.testnet';
const receiver = 'testuser1.testnet';

export async function getBalance() {
  const provider = new nearAPI.providers.JsonRpcProvider(config.nodeUrl);
  const state = await provider.query(`account/${sender}`, '');
  // console.log(`Account ID: ${sender}`);
  console.log(`Balance: ${nearAPI.utils.format.formatNearAmount(state.amount, 4)}`);
  return nearAPI.utils.format.formatNearAmount(state.amount, 4);
}
