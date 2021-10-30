import React, {
  FC, memo, useCallback, useEffect, useState,
} from 'teact/teact';
import Modal from '../ui/Modal';
import RadioGroup from '../ui/RadioGroup';
import Radio from '../ui/Radio';
import Button from '../ui/Button';
import { IOffer } from '../../types/HeymateTypes/Offer.model';
import { axiosService } from '../../api/services/axiosService';
import { HEYMATE_URL } from '../../config';
import TabList from '../ui/TabList';
import { ITimeSlotModel } from '../../types/HeymateTypes/TimeSlot.model';

import Transition from '../ui/Transition';

import useLang from '../../hooks/useLang';
import './BookOfferDialog.scss';

type OwnProps = {
  offer: IOffer;
  openModal: boolean;
  onCloseModal: () => void;
};

enum BookOfferModalTabs {
  TIME_SLOTS,
  CALENDAR,
}

const BookOfferDialog: FC<OwnProps> = ({
  offer,
  openModal = false,
  onCloseModal,
}) => {
  const lang = useLang();

  const [timeSlots, setTimeSlots] = useState<ITimeSlotModel[]>([]);

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
      getOfferTimeSlots(offer.id).then((r) => {
        setTimeSlots(r);
      });
    }
  }, [offer]);
  const TIME_SLOTS: { value: string; label: string; subLabel: string }[] = [
    { value: 'single', label: 'Monday, 6.17.2021', subLabel: '12:00 - 18:00' },
    { value: 'bundle1', label: 'Monday, 6.17.2021', subLabel: '12:00 - 18:00' },
    { value: 'bundle2', label: 'Monday, 6.17.2021', subLabel: '12:00 - 18:00' },
    { value: 'bundle3', label: 'Monday, 6.17.2021', subLabel: '12:00 - 18:00' },
    { value: 'bundle4', label: 'Monday, 6.17.2021', subLabel: '12:00 - 18:00' },
    { value: 'bundle5', label: 'Monday, 6.17.2021', subLabel: '12:00 - 18:00' },
  ];

  const [selectedReason, setSelectedReason] = useState('single');

  const handleSelectType = useCallback((value: string) => {
    setSelectedReason(value);
  }, []);

  const [activeTab, setActiveTab] = useState<BookOfferModalTabs>(BookOfferModalTabs.TIME_SLOTS);
  const handleSwitchTab = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  const handleChange = () => {
    console.log('change happend');
  };

  return (
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
          name={lang.isRtl ? 'slide-reversed' : 'slide'}
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
                      <span id="time-picker">May 20,2021</span>
                    </div>
                    <div className="time-slots-rows custom-scroll">
                      <div className="time-slot-row actions">
                        <Radio
                          name="abs"
                          label="12:00 PM - 01:30 PM"
                          value="15245454545"
                          checked={false}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                );
              case BookOfferModalTabs.CALENDAR:
                return (
                  <div>
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
        <Button className="see-details" size="smaller" color="primary">
          Book Now
        </Button>
      </div>
    </Modal>
  );
};

export default memo(BookOfferDialog);
