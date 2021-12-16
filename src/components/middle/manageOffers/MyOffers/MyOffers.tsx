import React, {
  FC, memo, useCallback, useEffect, useState,
} from 'teact/teact';
import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { ITimeSlotModel } from 'src/types/HeymateTypes/TimeSlot.model';
import { CalendarModal } from '../../../common/CalendarModal';
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
import { getDayStartAt } from '../../../../util/dateFormat';

const MyOffers: FC = () => {
  const [offersList, setOffersList] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectDate] = useState('Date');
  const [filteredOffers, setFilteredOffers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
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
      const flatList: any = [];
      response.data.data.forEach((item: any) => {
        item.schedules.forEach((time: any) => {
          flatList.push({ ...item, ...{ selectedSchedule: time } });
        });
      });
      setOffersList(flatList);
      setFilteredOffers(flatList);
    }
  };
  useEffect(() => {
    getMyOffers();
  }, []);

  const handleRescheduleMessage = useCallback((date: Date) => {
    // const startDate: any = date;
    // const endDate: any = date;
    const stringDateArr = date.toString().split(' ');
    const stringDate = `${stringDateArr[1]} ${stringDateArr[2]}, ${stringDateArr[3]}`;
    setSelectDate(stringDate);
    // startDate = startDate.setHours(0, 0, 0, 0);
    // endDate = endDate.setHours(23, 59, 59, 999);
    // const filterDates = timeSlots.filter((item) => (startDate <= item.fromTs && item.fromTs <= endDate));
    setIsCalendarOpen(false);
    // setFilteredDate(filterDates);
  }, []);

  const handleStatusChange = useCallback((e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    if (filter === 'All') {
      setFilteredOffers(offersList);
    } else {
      const filtered = offersList.filter((item) => item.selectedSchedule.status === filter);
      setFilteredOffers(filtered);
    }
  }, [offersList]);

  return (
    <div className="MyOrders-middle">
      <div className="myOrder-middle-filter">
        <div className="filters-holder">
          <div className="filters-select">
            <Select
              label="Status"
              placeholder="Status"
              onChange={handleStatusChange}
              value={statusFilter}
              hasArrow={Boolean(true)}
              id="status-filter"
            >
              <option value="All">All</option>
              <option value="BOOKED">BOOKED</option>
              <option value="MARKED_AS_STARTED">MARKED AS STARTED</option>
              <option value="STARTED">STARTED</option>
              <option value="MARKED_AS_FINISHED">MARKED AS FINISHED</option>
              <option value="FINISHED">FINISHED</option>
              <option value="INPROGRESS">INPROGRESS</option>
              <option value="CANCELED_BY_SERVICE_PROVIDER">CANCELED BY SERVICE PROVIDER</option>
              <option value="CANCELED_BY_CONSUMER">CANCELED BY CONSUMER</option>

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
          <div className="filters-date" onClick={() => setIsCalendarOpen(true)}>
            <span>{selectedDate}</span>
          </div>
        </div>
        <div>
          <Button size="tiny" color="translucent">
            Clear All
          </Button>
        </div>
      </div>
      {filteredOffers.length > 0 ? (
        filteredOffers.map((item) => (
          <div>
            <Offer props={item} />
          </div>
        ))
      ) : (
        <div className="loading-my-orders">
          <Loading key="loading" />
        </div>
      )}
      <CalendarModal
        isOpen={isCalendarOpen}
        submitButtonLabel="Select"
        selectedAt={getDayStartAt(Date.now())}
        isFutureMode
        onClose={() => setIsCalendarOpen(false)}
        onSubmit={handleRescheduleMessage}
      />
    </div>
  );
};
export default memo(MyOffers);
