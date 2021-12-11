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

type OwnProps = {
  scheduleType?: 'MyOrders' | 'MyOffers';
};
const MyOrders: FC<OwnProps> = ({
  scheduleType = 'MyOrders',
}) => {
  const [myOrders, setMyOrders] = useState<IMyOrders[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  /**
   * Get All Offers
   */
  const getMyOrders = async () => {
    setIsLoading(true);
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/myOrders`,
      method: 'GET',
      body: {},
    });
    setIsLoading(false);
    if (response?.status === 200) {
      setMyOrders(response.data.data);
    }
  };

  const getMyOffers = async () => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/me`,
      method: 'GET',
      body: {},
    });
    if (response?.status === 200) {
      setMyOrders(response.data);
    }
  };

  const renderMyOrders = () => {
    return myOrders.map((item) => (
      <Offer props={item} offerType={item.offer.meeting_type} />
    ));
  };
  useEffect(() => {
    if (scheduleType === 'MyOrders') {
      getMyOrders();
    } else {
      getMyOffers();
    }
  }, [scheduleType]);
  return (
    <div className="MyOrders">
      {isLoading ? (
        <div className="loading-my-orders">
          <Loading key="loading" />
        </div>
      ) : myOrders.length > 0 ? renderMyOrders() : (
        <div className="no-order">
          There’s no available order for you !
        </div>
      )}
    </div>
  );
};
export default memo(MyOrders);
