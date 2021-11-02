import React, {
  FC, memo, useCallback, useEffect, useState,
} from 'teact/teact';
import { ChangeEvent } from 'react';
import Modal from '../ui/Modal';
import Radio from '../ui/Radio';
import { IOffer } from '../../types/HeymateTypes/Offer.model';
import { axiosService } from '../../api/services/axiosService';
import { HEYMATE_URL } from '../../config';
import TabList from '../ui/TabList';
import { ITimeSlotModel } from '../../types/HeymateTypes/TimeSlot.model';
import Button from '../ui/Button';
import Transition from '../ui/Transition';

import useLang from '../../hooks/useLang';
import './BookOfferDialog.scss';

import { getDayStartAt } from '../../util/dateFormat';
import { CalendarModal } from './CalendarModal';

type OwnProps = {
  offer: IOffer;
  openModal: boolean;
  onCloseModal: () => void;
  purchasePlanType?: 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';
};

enum BookOfferModalTabs {
  TIME_SLOTS,
  CALENDAR,
}
interface ITimeSlotsRender extends ITimeSlotModel{
  fromDateLocal?: string;
  toDateLocal?: string;
}
interface IBookOfferModel {
  offerId: string;
  serviceProviderId: string;
  purchasedPlanId?: string;
  timeSlotId: string;
  meetingId: string;
}
const BookOfferDialog: FC<OwnProps> = ({
  offer,
  openModal = false,
  onCloseModal,
  purchasePlanType = 'SINGLE',
}) => {
  const lang = useLang();

  const [timeSlots, setTimeSlots] = useState<ITimeSlotsRender[]>([]);

  const [bookOfferLoading, setBookOfferLoading] = useState(false);

  const tabs = [
    { type: BookOfferModalTabs.TIME_SLOTS, title: 'Time Slots' },
    { type: BookOfferModalTabs.CALENDAR, title: 'Calendar' },
  ];

  const getOfferTimeSlots = async (offerId) => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/time-table/${offerId}/schedule`,
      method: 'GET',
      body: {},
    });
    return response.data;
  };

  const handleCLoseDetailsModal = () => {
    onCloseModal();
  };

  useEffect(() => {
    if (offer) {
      getOfferTimeSlots(offer.id).then((res) => {
        const temp = res.data.map((item: ITimeSlotsRender) => {
          let fromTs = parseInt(item.form_time, 10);
          let toTs = parseInt(item.to_time, 10);
          if (item.form_time.length <= 10) {
            fromTs *= 1000;
            toTs *= 1000;
          }
          item.fromDateLocal = new Date(fromTs).toLocaleTimeString();
          item.toDateLocal = new Date(toTs).toLocaleTimeString();
          return item;
        });
        setTimeSlots(temp);
      });
    }
  }, [offer]);

  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('');

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSelectedTimeSlotId(value);
  }, []);

  const purchaseAPlan = async () => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/purchase-plan`,
      method: 'POST',
      body: {
        planType: purchasePlanType,
        offerId: offer.id,
      },
    });
    return response.data.data;
  };

  const handleBookOffer = async () => {
    setBookOfferLoading(true);
    let planId;
    if (purchasePlanType !== 'SINGLE') {
      const plan = await purchaseAPlan();
      if (plan) {
        planId = plan.id;
      }
    }
    const data: IBookOfferModel = {
      offerId: offer.id,
      serviceProviderId: offer.userId,
      purchasedPlanId: planId,
      timeSlotId: selectedTimeSlotId,
      meetingId: '',
    };
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation`,
      method: 'POST',
      body: data,
    });
    setBookOfferLoading(false);
    if (response.status === 201) {
      alert('Offer Booked Successfuly !');
      handleCLoseDetailsModal();
    } else {
      alert('some thing went wrong !');
    }
  };

  const [activeTab, setActiveTab] = useState<BookOfferModalTabs>(BookOfferModalTabs.TIME_SLOTS);

  const handleSwitchTab = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleOpenCalendarModal = () => {
    setIsCalendarOpen(true);
  };

  const handleRescheduleMessage = useCallback((date: Date) => {
    console.log(date);
  }, []);

  return (
    <div>
      <Modal
        hasCloseButton
        isOpen={openModal}
        onClose={handleCLoseDetailsModal}
        onEnter={openModal ? handleCLoseDetailsModal : undefined}
        className="BookOfferModal"
        title="Schedule"
      >
        <div className="book-offer-content">
          <TabList activeTab={activeTab} tabs={tabs} onSwitchTab={handleSwitchTab} />
          <Transition
            className="full-content"
            name={lang.isRtl ? 'slide-reversed' : 'mv-slide'}
            renderCount={tabs.length}
            activeKey={activeTab}
          >
            {() => {
              switch (activeTab) {
                case BookOfferModalTabs.TIME_SLOTS:
                  return (
                    <div className="TimeSlots">
                      <div className="time-slots-picker">
                        <span id="caption">Available times for</span>
                        <span
                          id="time-picker"
                          onClick={handleOpenCalendarModal}
                        >All
                        </span>
                      </div>
                      <div className="time-slots-rows custom-scroll">
                        {timeSlots.length > 0 && timeSlots.map((item) => (
                          <div className="time-slot-row actions">
                            <Radio
                              name="abs"
                              label={`${item.fromDateLocal} - ${item.toDateLocal}`}
                              value={item.id}
                              checked={false}
                              onChange={handleChange}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                case BookOfferModalTabs.CALENDAR:
                  return (
                    <div className="Calendar">
                      Calendar Content
                    </div>
                  );
                default:
                  return (
                    <div>ehsan</div>
                  );
              }
            }}
          </Transition>
        </div>
        <div className="btn-group">
          <Button className="book-offer" size="smaller" color="translucent">
            <span>Cancel</span>
          </Button>
          <Button
            isLoading={bookOfferLoading}
            onClick={handleBookOffer}
            className="see-details"
            size="smaller"
            color="primary"
          >
            Book Now
          </Button>
        </div>
      </Modal>
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

export default memo(BookOfferDialog);
