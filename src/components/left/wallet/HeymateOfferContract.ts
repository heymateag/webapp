import { Contract } from 'web3-eth-contract';
import HeymateOffer from './HeymateOffer';

class HeymateOfferContract extends Contract {
  constructor(address: string) {
    super(HeymateOffer.abi, address);
  }
}

export default HeymateOfferContract;
