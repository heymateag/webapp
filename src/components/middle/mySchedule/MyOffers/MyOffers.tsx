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
import GenerateNewDate from '../../helpers/generateDateBasedOnTimeStamp';

const MyOffers: FC = () => {
  const [offersList, setOffersList] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectDate] = useState('Date');
  const [filteredOffers, setFilteredOffers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Get All Offers
   */
  const getMyOffers = async () => {
    setLoading(true);
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/me`,
      method: 'GET',
      body: {},
    });
    setLoading(false);
    if (response?.status === 200) {
      const flatList: any = [];
      response.data.data.forEach((item: any) => {
        item.schedules.forEach((time: any) => {
          if (time.maximumReservations === time.remainingReservations) {
            return;
          }
          flatList.push({ ...item, ...{ selectedSchedule: time } });
        });
      });
      flatList.sort((a, b) => {
        return b.selectedSchedule?.form_time - a.selectedSchedule?.form_time;
      });
      setOffersList(flatList);
      setFilteredOffers(flatList);
    }
  };
  useEffect(() => {
    getMyOffers();
  }, []);

  const handleDateChange = useCallback((date: any) => {
    // eslint-disable-next-line max-len
    const filtered = offersList.filter((item) => GenerateNewDate(item.selectedSchedule?.form_time).setHours(0,0,0,0) === (date.getTime()));
    setFilteredOffers(filtered);
  }, [offersList]);

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
    handleDateChange(date);
  }, [handleDateChange]);

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

  const handleTypeChange = useCallback((e) => {
    const filter = e.target.value;
    setTypeFilter(filter);
    if (filter === 'All') {
      setFilteredOffers(offersList);
    } else {
      debugger
      const filtered = offersList.filter((item) => item.meeting_type === filter);
      setFilteredOffers(filtered);
    }
  }, [offersList]);

  const clearFilters = () => {
    setStatusFilter('All');
    setTypeFilter('All');
    setSelectDate('Date');
    setFilteredOffers(offersList);
  };

  return (
    <div className="MyOrders-middle custom-scroll">
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
              onChange={handleTypeChange}
              value={typeFilter}
              hasArrow={Boolean(true)}
              id="type-filter"
            >
              <option value="All">All</option>
              <option value="DEFAULT">Offline</option>
              <option value="ONLINE">Online</option>
            </Select>
          </div>
          <div className="filters-date" onClick={() => setIsCalendarOpen(true)}>
            <span>{selectedDate}</span>
          </div>
        </div>
        <div>
          <Button size="tiny" color="translucent" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </div>
      {!loading ? (
        <>
          {filteredOffers.length > 0 ? (filteredOffers.map((item) => (
            <div key={item.selectedSchedule.id}>
              <Offer props={item} />
            </div>
          ))) : (
            <div className="no-order">
              There’s no available order for you !
            </div>
          )}
        </>
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
