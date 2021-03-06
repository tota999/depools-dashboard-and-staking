import {TONClient} from "ton-client-web-js";
import freeton from "freeton";
import semver from "semver";

const depoolAbi = require('@/contracts/DePool.abi.json');

const _ = {
  client: null,
  async getClient() {
    if (null === this.client) {
      this.client = await TONClient.create({servers: ['main.ton.dev']});
    }
    return this.client;
  }
};

export default {
  transactionAdditionalFee: '500000000',
  convertFromNano(amountNano, noFormat = false) {
    const amountBigInt = BigInt(amountNano);
    const integer = amountBigInt / BigInt('1000000000');
    return noFormat ? integer.toString() : integer.toLocaleString();
  },
  convertToNano(amount) {
    return (BigInt(amount) * BigInt('1000000000')).toString();
  },
  async sendTransactionToDepool(provider, address, functionName, params, amount) {
    const client = await _.getClient();
    const message = await client.contracts.createRunBody({
      abi: depoolAbi,
      function: functionName,
      params,
      internal: true
    });
    const signer = await provider.getSigner();
    const wallet = signer.getWallet();
    await wallet.transfer(address, amount, true, message.bodyBase64);
  },
  async isExtensionAvailableWithMinimalVersion() {
    return new Promise(resolve => {
      if (typeof window.freeton === 'undefined') {
        resolve(false);
      }
      const provider = new freeton.providers.ExtensionProvider(window.freeton);
      provider.getVersion().then(data => {
        const currentVersion = data.version || '0.0.0';
        resolve(semver.satisfies(currentVersion, '>=0.4.0'));
      }).catch(() => {
        resolve(false);
      });
    });
  }
}
