import { Contract } from '@celo/connect';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import { newKitFromWeb3 } from '@celo/contractkit';
import HeymateOffer from './HeymateOffer';

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
    const HeymateContract = new myKit.web3.eth.Contract(HeymateOffer.abi as AbiItem[], this.address, {
      from: this.fromAddress, // default from address
      gasPrice: '4100000000', // default gas price in wei, 20 gwei in this case
    });
    return HeymateContract;
  }
}

export default OfferContract;
