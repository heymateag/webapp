import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { ITimeSlotModel } from 'src/types/HeymateTypes/TimeSlot.model';
import { ContractKit, StableToken } from '@celo/contractkit';
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper';
import web3 from 'web3';
import BN from 'bn.js';
import OfferWrapper from './OfferWrapper';
import { axiosService } from '../../../api/services/axiosService';
import {
  HEYMATE_URL, RAMP_STAGING_URL, RAMP_PRODUCTION_URL, RAMP_MAIN_API_KEY,
} from '../../../config';

interface IBookOfferModel {
  offerId: string;
  serviceProviderId: string;
  purchasedPlanId?: string;
  timeSlotId: string;
  meetingId?: string;
  tradeId: string;
}

class OfferPurchase {
  offer: IOffer;

  timeSlot: ITimeSlotModel;

  mContractKit: ContractKit;

  address: string;

  mainNet: boolean;

  constructor(offer: IOffer, timeSlot: ITimeSlotModel, mContractKit: ContractKit, address: string, mainNet: boolean) {
    this.offer = offer;
    this.timeSlot = timeSlot;
    this.mContractKit = mContractKit;
    this.address = address;
    this.mainNet = mainNet;
  }

  purchase = async () => {
    // loading
    const convertedPrice = new BN((this.offer.pricing.price * 100) + 30);
    const amount = web3.utils.toWei(convertedPrice, 'ether').divRound(new BN(100));
    // get user balance
    let stableToken: StableTokenWrapper;
    if (this.offer.pricing.currency === 'USD') {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cUSD);
    } else {
      stableToken = await this.mContractKit.contracts.getStableToken(StableToken.cEUR);
    }
    const balance = await stableToken.balanceOf(this.address);
    if (new BN(balance.toString()) < amount) {
      //open ramp
      const payAmount = amount.sub(new BN(balance.toString()));
      let url = this.mainNet ? RAMP_PRODUCTION_URL : RAMP_STAGING_URL;
      url += `?userAddress${this.address}&hostApiKey=${RAMP_MAIN_API_KEY}&swapAmount=${payAmount}`;

      window.open(url, '_blank');
    } else {
      const tradeId: string = `0x${this.generateUUID()}`;
      const offerWrapper = new OfferWrapper(this.address, this.mContractKit, this.mainNet);
      offerWrapper.create(this.offer, this.timeSlot, tradeId);
      const data: IBookOfferModel = {
        offerId: this.offer.id,
        serviceProviderId: this.offer.userId,
        purchasedPlanId: undefined,
        timeSlotId: this.timeSlot.id,
        tradeId,
      };
      const response = await axiosService({
        url: `${HEYMATE_URL}/reservation`,
        method: 'POST',
        body: data,
      });
      return response;
    }
  };

  generateUUID = () => {
    let d = new Date().getTime();
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16;
      if (d > 0) {
        // eslint-disable-next-line no-bitwise
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        // eslint-disable-next-line no-bitwise
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      // eslint-disable-next-line no-bitwise
      // eslint-disable-next-line no-mixed-operators
      // eslint-disable-next-line no-bitwise
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
}

export default OfferPurchase;
