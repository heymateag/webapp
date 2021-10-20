import { IMediaModel } from './Media.model';
import { ITimeSlotModel } from './TimeSlot.model';

export enum MeetingType {
  'ONLINE' = 'ONLINE',
  'DEFAULT' = 'DEFAULT',
}

export interface IOffer {
  id: string;
  title: string;
  description: string;
  category: {
    main_cat: string;
    sub_cat: string;
  };
  meeting_type?: MeetingType;
  location?: {
    lat: string;
    lang: string;
    address: string;
  };
  // 0 means unlimted
  participants: number;
  remainingReservations?: number;
  completedReservations?: number;
  schedules: ITimeSlotModel[];
  pricing: {
    rate_type: string;
    price: number;
    currency: string;
    signature: string;
    bundle: {
      count: number;
      discount_percent: number;
      signature: string;
    };
    subscription: {
      period: string;
      subscription_price: number;
      signature: string;
    };
  };
  payment_terms: {
    // how much percent u get when u done the offer
    deposit: number;
    delay_in_start: {
      // in min
      duration: number;
      penalty: number;
    };
    cancellation: {
      // in min
      range: number;
      penalty: number;
    }[];
  };
  term_condition: string;
  referral_plan: {
    rate: number;
    type: string; // Enum LINER ...
  };
  sp_wallet_address: string;
  status: string; // ARCHIVED ACTIVE offer status
  userId: string; // who created offer ?
  media: IMediaModel[];
  created_at: string;
  updated_at: string;
  expiration: string; // Time Stamp
}

/**
 * Schedules Validator
 */
