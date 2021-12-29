import { Contract } from '@celo/connect';
import HeymateOffer from './HeymateOffer';

class OfferContract {
  address: string;

  fromAddress: string;

  constructor(address: string, fromAddress: string) {
    this.address = address;
    this.fromAddress = fromAddress;
  }

  create(): Contract {
    const HeymateContract = new Contract(HeymateOffer.abi, this.address, {
      from: this.fromAddress, // default from address
      gasPrice: '20000000000', // default gas price in wei, 20 gwei in this case
    });
    return HeymateContract;
  }
}

export default OfferContract;
