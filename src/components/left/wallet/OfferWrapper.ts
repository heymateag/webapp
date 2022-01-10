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

  provider: any;

  address: string;

  mainNet: boolean;

  constructor(address: string, contractKit: ContractKit, mainNet: boolean, provider: any) {
    let contract: Contract;
    this.provider = provider;
    this.mainNet = mainNet;
    if (mainNet) {
      contract = new OfferContract(OFFERS_ON_MAINNET, address, provider).create();
    } else {
      contract = new OfferContract(OFFERS_ON_ALFAJORES, address, provider).create();
    }
    // super(contractKit, contract);
    this.mContractKit = contractKit;
    this.mContract = contract;
    this.address = address;
  }

  create = async (offer: IOffer, timeSlot: ITimeSlotModel, tradeId: string) => {
    const planId = '0x00000000000000000000000000000000';
    const tradeIdHash = `${tradeId.split('-').join('')}`;
    // PricingInfo pricingInfo = new PricingInfo(new JSONObject(offer.getPricingInfo()));

    const rate: BN = new BN(offer.pricing.price);

    const amount = web3.utils.toWei(rate, 'ether');

    const initialDeposit = offer.payment_terms.deposit;

    // decide base on offer currency
    let stableToken: StableTokenWrapper;
    if (offer.pricing.currency === 'USD') {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cUSD);
    } else if (offer.pricing.currency === 'EUR') {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cEUR);
    } else {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cREAL);
    }
    const userAddresses: string[] = [
      offer.sp_wallet_address,
      // this.address,
      this.address,
      stableToken.address,
    ];

    // JSONObject configJSON = new JSONObject(offer.getTermsConfig());

    const config: BN[] = this.getConfig(offer);

    try {
      await this.transfer(amount, stableToken);
    } catch (error: any) {
      return new Error(error);
    }

    let answer;
    try {
      answer = await toTransactionObject(this.mContractKit.connection, this.mContract.methods.createOffer(
        tradeIdHash,
        planId,
        amount,
        new BN(1),
        new BN(offer.expiration),
        new BN(timeSlot.form_time),
        initialDeposit,
        userAddresses,
        config,
        [],
        [],
        offer.pricing.signature,
        // '0x00',
      )).send();
    } catch (error: any) {
      return new Error(error);
    }
    const receipt = await answer.getHash();
    return receipt;
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

  transfer = async (amount: any, stableToken: StableTokenWrapper) => {

    const x = await stableToken.transfer(this.mainNet ? OFFERS_ON_MAINNET : OFFERS_ON_ALFAJORES, amount).send();
    const resid = await x.getHash();
    return resid;
  };

  startService = async (offer: IOffer, tradeId: string, consumerAddress: string) => {
    let tradeIdHash;
    if (tradeId.length <= 36) {
      tradeIdHash = `${tradeId.split('-').join('')}`;
    } else {
      tradeIdHash = `${tradeId.split('-').join('')}`;
    }
    const pricingInfo = offer.pricing;
    const rate: number = pricingInfo.price;
    const amount = web3.utils.toWei(new BN(rate), 'ether');
    let answer;
    try {
      // eslint-disable-next-line max-len
      // const response = await this.mContract.methods.startService(tradeIdHash, offer.sp_wallet_address, consumerAddress, amount, new BN(1));
      answer = await toTransactionObject(this.mContractKit.connection, this.mContract.methods.startService(
        tradeIdHash,
        offer.sp_wallet_address,
        consumerAddress,
        amount,
        new BN(1),
      )).send();
    } catch (error) {
      throw new Error('start error');
    }
    let receipt;
    try {
      receipt = await answer.getHash();
      return receipt;
    } catch (error: any) {
      return new Error(error);
    }
  };

  cancelService = (tradeId: any, consumerCancelled: boolean, consumerAddress: string, amount: number) => {
    // const tradeIdHash = `${tradeId.split('-').join('')}`;

    if (consumerCancelled) {
      this.mContract.methods.consumerCancel(tradeId, this.address,
        consumerAddress, amount, new BN(1)).send();
    } else {
      this.mContract.methods.serviceProviderCancel(tradeId, this.address,
        consumerAddress, amount, new BN(1)).send();
    }
  };

  finishService = async (offer: IOffer, tradeId: string, consumerAddress: string) => {
    let tradeIdHash;
    if (tradeId.length <= 36) {
      tradeIdHash = `0x${tradeId.split('-').join('')}`;
    } else {
      tradeIdHash = `${tradeId.split('-').join('')}`;
    }
    const rate: BN = new BN(offer.pricing.price);
    const amount = web3.utils.toWei(rate, 'ether');
    let answer;

    try {
      answer = await toTransactionObject(this.mContractKit.connection, this.mContract.methods.release(
        tradeIdHash,
        offer.sp_wallet_address,
        consumerAddress, amount,
        new BN(1),
      )).send();
      // eslint-disable-next-line max-len
    } catch (error: any) {
      throw new Error(error);
    }
    let receipt;
    try {
      receipt = await answer.getHash();
      return receipt;
    } catch (error: any) {
      return new Error(error);
    }
  };
}

export default OfferWrapper;
