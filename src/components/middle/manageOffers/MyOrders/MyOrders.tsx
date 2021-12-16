import React, {
  FC, memo, useEffect, useState, useCallback,
} from 'teact/teact';
import Button from '../../../ui/Button';
import Select from '../../../ui/Select';
import { axiosService } from '../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../config';
import { IMyOrders, ReservationStatus } from '../../../../types/HeymateTypes/MyOrders.model';
import { MeetingType } from '../../../../types/HeymateTypes/Offer.model';
import OnlineMetting from '../OnlineMeeting/OnlineMetting';
import Loading from '../../../ui/Loading';
import './MyOrders.scss';
import Order from '../Order/Order';
import { CalendarModal } from '../../../common/CalendarModal';
import { getDayStartAt } from '../../../../util/dateFormat';

const MyOrders: FC = () => {
  const [myOrders, setMyOrders] = useState<IMyOrders[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<IMyOrders[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectDate] = useState('Date');
  const [loading, setLoading] = useState(false);

  /**
   * Get All Offers
   */
  const getMyOrders = async () => {
    setLoading(true);
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/myOrders`,
      method: 'GET',
      body: {},
    });
    setLoading(false);
    if (response?.status === 200) {
      setMyOrders(response.data.data);
      setFilteredOrders(response.data.data);
    }
  };
  useEffect(() => {
    getMyOrders();
  }, []);

  const handleStatusChange = useCallback((e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    if (filter === 'All') {
      setFilteredOrders(myOrders);
    } else {
      const filtered = myOrders.filter((item) => item.status === filter);
      setFilteredOrders(filtered);
    }
  }, [myOrders]);

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

  const clearFilters = () => {
    setSelectDate('Date');
    setStatusFilter('All');
    const e = {
      target: {
        value: 'All',
      },
    };
    handleStatusChange(e);
  };

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
            // error={formErrors.billingCountry}
            // ref={selectCountryRef}
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
              // value={statusFilter}
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
          <Button size="tiny" color="translucent" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </div>
      {!loading ? (
        <>
          {filteredOrders.length > 0 ? filteredOrders.map((item) => (
            <div>
              <Order props={item} orderType={item.offer.meeting_type} />
            </div>
          )) : (
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
export default memo(MyOrders);
