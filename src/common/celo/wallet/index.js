import ContractKit, { newKit } from '@celo/contractkit';

class Wallet {
  constructor(address, privateKey) {
    this.contractKit = newKit('https://alfajores-forno.celo-testnet.org');
    this.contractKit.addAccount(privateKey); // Hardcoded Private Key for now
    
    this.address = address;
  }

  async transfer(to, amount) {  
    const stableToken = await this.contractKit.contracts.getStableToken();
    const weiTransferAmount = this.contractKit.web3.utils.toWei(amount, 'ether');
    const tx = await stableToken.transfer(to, weiTransferAmount).send({
      from: this.address,
    });
    const hash = await tx.getHash();
    const receipt = await tx.waitReceipt();
    
    return {
      tx,
      hash,
      receipt,
    };
  }
  
  async balance() {
    const stableToken = await this.contractKit.contracts.getStableToken();
    const balance = await stableToken.balanceOf(this.address);
    return this.contractKit.web3.utils.fromWei(balance.toString());
  }
}

export default Wallet;
