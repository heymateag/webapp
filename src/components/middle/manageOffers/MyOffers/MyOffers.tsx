import React, {
  FC, memo, useEffect, useState,
} from 'teact/teact';
import Button from '../../../ui/Button';
import Select from '../../../ui/Select';
import { axiosService } from '../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../config';
// import { IMyOrders } from '../../../../types/HeymateTypes/MyOrders.model';
import { MeetingType } from '../../../../types/HeymateTypes/Offer.model';
import OnlineMetting from '../OnlineMeeting/OnlineMetting';
import Offer from '../Offer/Offer';
import Loading from '../../../ui/Loading';

import './MyOffers.scss';

const MyOffers: FC = () => {
  const [offersList, setOffersList] = useState<any[]>([]);
  /**
   * Get All Offers
   */
  const getMyOffers = async () => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/me`,
      method: 'GET',
      body: {},
    });
    if (response?.status === 200) {
      setOffersList(response.data.data);
    }
  };
  useEffect(() => {
    getMyOffers();
  }, []);
  return (
    <div className="MyOrders-middle">
      <div className="myOrder-middle-filter">
        <div className="filters-holder">
          <div className="filters-select">
            <Select
              label="Status"
              placeholder="Status"
              // onChange={alert("sd")}
              // value={state.billingCountry}
              hasArrow={Boolean(true)}
              id="billing-country"
            // error={formErrors.billingCountry}
            // ref={selectCountryRef}
            >
              <option value="x">All</option>

            </Select>
          </div>
          <div className="filters-select">
            <Select
              label="Type"
              placeholder="Type"
              // onChange={alert("sd")}
              // value={state.billingCountry}
              hasArrow={Boolean(true)}
              id="billing-country"
            // error={formErrors.billingCountry}
            // ref={selectCountryRef}
            >
              <option value="x">All</option>
              <option value="x">Single</option>
              <option value="x">Double</option>
              <option value="x">Subscription</option>
            </Select>
          </div>
          <div className="filters-select">
            <Select
              label="Date"
              placeholder="Date"
              // onChange={alert("sd")}
              // value={state.billingCountry}
              hasArrow={Boolean(true)}
              id="billing-country"
            // error={formErrors.billingCountry}
            // ref={selectCountryRef}
            >
              <option value="x">y</option>
            </Select>
          </div>
        </div>
        <div>
          <Button size="tiny" color="translucent">
            Clear All
          </Button>
        </div>
      </div>
      {offersList.length > 0 ? (
        offersList.map((item) => (
          <div>
            {item.meeting_type === MeetingType.ONLINE ? (
              <OnlineMetting props={{ id: item.id, offer: item }} />
            ) : (
              <Offer props={{ id: item.id, offer: item }} />
            )}
          </div>
        ))
      ) : (
        <div className="loading-my-orders">
          <Loading key="loading" />
        </div>
      )}
    </div>
  );
};
export default memo(MyOffers);
