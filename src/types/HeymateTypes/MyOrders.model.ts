import { IOffer } from './Offer.model';
import { ITimeSlotModel } from './TimeSlot.model';
import { ReservationStatus } from './ReservationStatus';

export interface IMyOrders {
  id: string;
  offer: IOffer;
  time_slot?: ITimeSlotModel;
  status?: ReservationStatus;
  meetingId?: string;
  meetingPassword?: string;
  createdAt?: string;
  serviceProviderId?: string;
  tradeId?: string;
  offerId?: string;
  serviceProvider?: {
    telegramId: string;
  };
}
