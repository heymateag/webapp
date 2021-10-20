import React, {
  FC, memo, useEffect, useState,
} from 'teact/teact';
import { axiosService } from '../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../config';
import { IMyOrders } from '../../../../types/HeymateTypes/MyOrders.model';
import { MeetingType } from '../../../../types/HeymateTypes/Offer.model';
import OnlineMetting from '../OnlineMeeting/OnlineMetting';
import Offer from '../Offer/Offer';
import Loading from '../../../ui/Loading';

import './MyOrders.scss';

const MyOrders: FC = () => {
  const [myOrders, setMyOrders] = useState<IMyOrders[]>([]);
  /**
   * Get All Offers
   */
  const getMyOrders = async () => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/myOrders`,
      method: 'GET',
      body: {},
    });
    if (response?.status === 200) {
      setMyOrders(response.data.data);
    }
  };
  useEffect(() => {
    getMyOrders();
  }, []);
  return (
    <div className="MyOrders">
      {myOrders.length > 0 ? myOrders.map((item) => (
        <div>
          {
            item.offer.meeting_type === MeetingType.ONLINE ? (
              <OnlineMetting props={item} />
            )
              : (
                <Offer props={item} />
              )
          }
        </div>
      )) : (
        <div className="loading-my-orders">
          <Loading key="loading" />
        </div>
      )}
    </div>
  );
};
export default memo(MyOrders);
