// eslint-disable-next-line import/no-cycle
import { ReservationStatus } from './MyOrders.model';

export interface ITimeSlotModel {
  id: string;
  offerId: string;
  form_time: string;
  to_time: string;
  updated_at: string;
  created_at: string;
  status?: ReservationStatus;
}
