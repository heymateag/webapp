import { ContractKit, StableToken } from '@celo/contractkit';
// import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper';
import { toTransactionObject, Contract } from '@celo/connect';
import web3 from 'web3';
import BN from 'bn.js';
import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { ReservationModel } from 'src/types/HeymateTypes/Reservation.model';
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper';
import { OFFERS_ON_ALFAJORES, OFFERS_ON_MAINNET } from '../../../config';
import { ITimeSlotModel } from '../../../types/HeymateTypes/TimeSlot.model';
import OfferContract from './OfferContract';

class OfferWrapper {
  mContractKit: ContractKit;

  mContract: Contract;

  constructor(address: string, contractKit: ContractKit, mainNet: boolean) {
    let contract: Contract;
    if (mainNet) {
      contract = new OfferContract(OFFERS_ON_MAINNET, address).create();
    } else {
      contract = new OfferContract(OFFERS_ON_ALFAJORES, address).create();
    }
    // super(contractKit, contract);
    this.mContractKit = contractKit;
    this.mContract = contract;
  }

  create = async (offer: IOffer, timeSlot: ITimeSlotModel, tradeId: string) => {
    const planId = '0x00000000000000000000000000000000';

    // PricingInfo pricingInfo = new PricingInfo(new JSONObject(offer.getPricingInfo()));

    const rate: BN = new BN(offer.pricing.price);

    const amount = web3.utils.toWei(rate, 'ether');

    const initialDeposit = offer.payment_terms.deposit;

    // decide base on offer currency
    let stableToken;
    if (offer.pricing.currency === 'USD') {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cUSD);
    } else {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cEUR);
    }
    const userAddresses: string[] = [
      offer.sp_wallet_address,
      this.address,
      stableToken.address,
    ];

    // JSONObject configJSON = new JSONObject(offer.getTermsConfig());

    const config: BN[] = this.getConfig(offer);

    this.transfer(rate, stableToken);

    try {
      await toTransactionObject(this.mContractKit.connection, this.mContract.methods.createOffer(
        tradeId,
        planId,
        amount,
        1, // bn 1
        new BN(offer.expiration),
        new BN(timeSlot.form_time),
        initialDeposit,
        userAddresses,
        config,
        [],
        [],
        offer.pricing.signature,
      ));

      // String transactionHash = receipt.getTransactionHash(); ehsan piade mikone

      // System.out.println(transactionHash); // TODO To be returned for the new back-end.
    } catch (error) {
      throw new Error('error');
    }
  };

  getConfig = (offer: IOffer) => {
    const config: any[] = [];
    const hours1: BN = new BN(offer.payment_terms.cancellation[0].range);
    const percent1: BN = new BN(offer.payment_terms.cancellation[0].penalty);
    const hours2: BN = new BN(offer.payment_terms.cancellation[1].range);
    const percent2: BN = new BN(offer.payment_terms.cancellation[1].penalty);
    const delayTime: BN = new BN(offer.payment_terms.delay_in_start.duration);
    const delayPercent: BN = new BN(offer.payment_terms.delay_in_start.penalty);

    if (hours1 > hours2) {
      config.push(hours1);
      config.push(percent1);
      config.push(hours2);
      config.push(percent2);
    } else {
      config.push(hours2);
      config.push(percent2);
      config.push(hours1);
      config.push(percent1);
    }

    config.push(delayTime);
    config.push(delayPercent);
    config.push(new BN(4)); // Linear config
    config.push(new BN(offer.referral_plan.rate));

    return config;
  };

  transfer = async (amount: BN, stableToken: StableTokenWrapper) => {
    await stableToken.transfer(OFFERS_ON_ALFAJORES, amount.toString()).send();
  };

  startService = async (offer: IOffer, reservation: ReservationModel, consumerAddress: string) => {
    const tradeId = `0x${reservation.id.replace('-', '')}`;
    const pricingInfo = offer.pricing;
    const rate: number = pricingInfo.price;
    const amount = web3.utils.toWei(new BN(rate), 'ether');
    try {
      await this.contract.methods.startService(tradeId, offer.sp_wallet_address, consumerAddress, amount, new BN(1));
    } catch (error) {
      throw new Error('start error');
    }
  };

  cancelService = (tradeId: any, consumerCancelled: boolean, consumerAddress: string, amount: number) => {
    if (consumerCancelled) {
      this.mContract.consumerCancel(tradeId, this.address,
        consumerAddress, amount, 1).send();
    } else {
      this.mContract.serviceProviderCancel(tradeId, this.address,
        consumerAddress, amount, 1).send();
    }
  };
}

export default OfferWrapper;
