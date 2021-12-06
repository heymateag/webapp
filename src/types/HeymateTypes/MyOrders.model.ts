import { IOffer } from './Offer.model';
import { ITimeSlotModel } from './TimeSlot.model';

export enum ReservationStatus {
  'BOOKED' = 'BOOKED',
  'MARKED_AS_STARTED' = 'MARKED_AS_STARTED',
  'STARTED' = 'STARTED',
  'MARKED_AS_FINISHED' = 'MARKED_AS_FINISHED',
  'FINISHED' = 'FINISHED',
  'INPROGRESS' = 'INPROGRESS',
  'CANCELED_BY_SERVICE_PROVIDER' = 'CANCELED_BY_SERVICE_PROVIDER',
  'CANCELED_BY_CONSUMER ' = 'CANCELED_BY_CONSUMER ',
}
export interface IMyOrders {
  id: string;
  offer: IOffer;
  time_slot?: ITimeSlotModel;
  status?: ReservationStatus;
  meetingId?: string;
  createdAt?: string;
  serviceProviderId?: string;
}
