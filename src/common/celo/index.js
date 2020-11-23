import Wallet from './wallet';
import { getAddress } from './api';

const privateKey = '0x968ec1919af03a50fe1d5bdb9d7dc7388afc210bd0c8e5fd0cb5d8eb85183a5c';
const address = '0x8920565d5Bc8cf942eD2E18df4B71b8695a22D9B';

const wallet = new Wallet(address, privateKey);

export { wallet, getAddress };

// wallet.balance().then(console.log);
// api.getAddress('mesquka').then(console.log);

// async function testTipMesquka() {
//   const to = await api.getAddress('mesquka');
//   console.log(await wallet.transfer(to, '0.01'));
// }



// testTipMesquka();


