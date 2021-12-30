import { Contract } from '@celo/connect';
import HeymateOffer from './HeymateOffer';
import Web3 from 'web3';
import { newKitFromWeb3 } from '@celo/contractkit';

class OfferContract {
  address: string;

  fromAddress: string;

  provider: any;

  constructor(address: string, fromAddress: string, provider: any) {
    this.address = address;
    this.fromAddress = fromAddress;
    this.provider = provider;
  }

  create(): Contract {
    const web3 = new Web3(this.provider);
    // @ts-ignore
    const myKit = newKitFromWeb3(web3);
    const HeymateContract = new myKit.web3.eth.Contract(HeymateOffer.abi, this.address, {
      from: this.fromAddress, // default from address
      gasPrice: '4100000000', // default gas price in wei, 20 gwei in this case
    });
    return HeymateContract;
  }
}

export default OfferContract;
