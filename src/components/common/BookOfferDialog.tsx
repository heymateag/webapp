import React, {
  FC, memo, useCallback, useEffect, useState, useRef, useMemo,
} from 'teact/teact';
import { ChangeEvent } from 'react';
import { withGlobal } from 'teact/teactn';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { GlobalActions } from 'src/global/types';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
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
import { pick } from '../../util/iteratees';
import { getDayStartAt } from '../../util/dateFormat';
import { CalendarModal } from './CalendarModal';
import buildClassName from '../../util/buildClassName';
import OfferPurchase from '../left/wallet/OfferPurchase';
import { sendcUSD } from '../left/wallet/AccountManager/AccountMannager';
import Spinner from '../ui/Spinner';

type OwnProps = {
  offer: IOffer;
  openModal: boolean;
  onCloseModal: () => void;
  purchasePlanType?: 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';
};
type DispatchProps = Pick<GlobalActions, 'showNotification'>;

enum BookOfferModalTabs {
  TIME_SLOTS,
  CALENDAR,
}
interface ITimeSlotsRender extends ITimeSlotModel{
  fromTs: number;
  toTs: number;
  fromDateLocal?: string;
  toDateLocal?: string;
  remainingReservations?: number;
  completedReservations?: number;
  maximumReservations?: number; // 0 means unlimited
}
interface IBookOfferModel {
  offerId: string;
  serviceProviderId: string;
  purchasedPlanId?: string;
  timeSlotId: string;
  meetingId?: string;
}
const BookOfferDialog: FC<OwnProps & DispatchProps> = ({
  offer,
  openModal = false,
  onCloseModal,
  purchasePlanType = 'SINGLE',
  showNotification,
}) => {
  const lang = useLang();

  const [timeSlots, setTimeSlots] = useState<ITimeSlotsRender[]>([]);
  const [timeSlotList, setTimeSlotList] = useState<ITimeSlotsRender[]>([]);
  const [filteredDate, setFilteredDate] = useState<ITimeSlotsRender[]>([]);

  const [bookOfferLoading, setBookOfferLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>('All');

  const [openQrModal, setOpenQRModal] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [uri, setUri] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { type: BookOfferModalTabs.TIME_SLOTS, title: 'Time Slots' },
    { type: BookOfferModalTabs.CALENDAR, title: 'Calendar' },
  ];

  const provider = useMemo(() => {
    return new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      qrcode: false,
      clientMeta: {
        description: 'Just a test description !',
        icons: [],
        url: 'www.ehsan.com',
        name: 'Heymate App',
      },
    });
  }, []);
  const renderUriAsQr = (givenUri?) => {
    setOpenQRModal(true);
    setLoadingQr(true);

    setTimeout(() => {
      const validUri = givenUri || uri;

      const container = qrCodeRef.current!;
      container.innerHTML = '';
      container.classList.remove('pre-animate');

      QrCreator.render({
        text: `${validUri}`,
        radius: 0.5,
        ecLevel: 'M',
        fill: '#4E96D4',
        size: 280,
      }, container);
      setLoadingQr(false);
    }, 100);
  };


  const handleOpenWCModal = async () => {
    if (uri === '') {
      await provider.enable();
    }
    setOpenQRModal(true);
    setLoadingQr(true);
    renderUriAsQr();
  };

  /**
   * Get Account Data
  */
  provider.connector.on('display_uri', (err, payload) => {
    setIsConnected(false);
    const wcUri = payload.params[0];
    setUri(wcUri);
    renderUriAsQr(wcUri);
    setLoadingQr(false);
  });

  const handleCLoseWCModal = () => {
    setOpenQRModal(false);
    provider.isConnecting = false;
    setLoadingBalance(false);
  };

  const getTodayRawDateString = useCallback((selectedTs) => {
    const currentDate = new Date();
    const unixTime = currentDate.getTime();
    const rawDate = new Date(unixTime).toString().split(' ');
    const toShowRawDate = `${rawDate[0]}, ${rawDate[1]} ${rawDate[2]} ${rawDate[3]}`;
    setSelectedDate(toShowRawDate);

    const startDate = currentDate.setHours(0, 0, 0, 0);
    const endDate = currentDate.setHours(23, 59, 59, 999);
    const filterDates = selectedTs.filter((item) => (startDate <= item.fromTs && item.fromTs <= endDate));
    setFilteredDate(filterDates);
  }, []);

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
          item.fromTs = fromTs;
          item.toTs = toTs;
          item.fromDateLocal = new Date(fromTs).toLocaleTimeString();
          item.toDateLocal = new Date(toTs).toLocaleTimeString();
          return item;
        });
        setTimeSlots(temp);
        setTimeSlotList(res.data);
        setFilteredDate(temp);
        getTodayRawDateString(temp);
      });
    }
  }, [getTodayRawDateString, offer]);

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

    const activeTs = timeSlotList.find((item) => item.id === selectedTimeSlotId);
    // const provider = new WalletConnectProvider({
    //   rpc: {
    //     44787: 'https://alfajores-forno.celo-testnet.org',
    //     42220: 'https://forno.celo.org',
    //   },qrcode: false
    // });
    let kit: ContractKit;
    let address: string;
    let offerPurchase;
    if (provider.isWalletConnect) {
      await provider.enable()
        .then((res) => {
          // eslint-disable-next-line prefer-destructuring
          address = res[0];
          setIsConnected(true);
          setOpenQRModal(false);
        });
      // @ts-ignore
      const web3 = new Web3(provider);
      // @ts-ignore
      kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      kit.defaultAccount = accounts[0];
      offerPurchase = new OfferPurchase(offer, activeTs, kit, provider.accounts[0], false, web3);
      const response = await offerPurchase.purchase();
      setBookOfferLoading(false);
      if (!response) {
        return;
      }
      if (response.status === 201) {
        showNotification({ message: 'Offer Booked Successfuly !' });
        handleCLoseDetailsModal();
      } else if (response.status === 406) {
        showNotification({ message: response.data.message });
      } else {
        showNotification({ message: 'Some thing went wrong !' });
      }
    } else {
      handleOpenWCModal();
    }
  };

  const [activeTab, setActiveTab] = useState<BookOfferModalTabs>(BookOfferModalTabs.TIME_SLOTS);

  const handleSwitchTab = useCallback((index: number) => {
    // setActiveTab(index); // Uncomment to calendar tab works
    setActiveTab(BookOfferModalTabs.TIME_SLOTS);
  }, []);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleOpenCalendarModal = () => {
    setIsCalendarOpen(true);
  };

  const handleRescheduleMessage = useCallback((date: Date) => {
    let startDate: any = date;
    let endDate: any = date;
    const stringDateArr = date.toString().split(' ');
    const stringDate = `${stringDateArr[1]} ${stringDateArr[2]}, ${stringDateArr[3]}`;
    setSelectedDate(stringDate);
    startDate = startDate.setHours(0, 0, 0, 0);
    endDate = endDate.setHours(23, 59, 59, 999);
    const filterDates = timeSlots.filter((item) => (startDate <= item.fromTs && item.fromTs <= endDate));
    setIsCalendarOpen(false);
    setFilteredDate(filterDates);
  }, [timeSlots]);

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
                        >{selectedDate}
                        </span>
                      </div>
                      <div className="time-slots-rows custom-scroll">
                        {filteredDate.length > 0 ? filteredDate.map((item) => (
                          <div
                            className={buildClassName('time-slot-row',
                              (selectedTimeSlotId === item.id) && 'active')}
                          >
                            <div>
                              <Radio
                                name={item.id}
                                label={`${item.fromDateLocal} - ${item.toDateLocal}`}
                                value={item.id}
                                checked={selectedTimeSlotId === item.id}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="remaining-of-total">
                              <span id="remaining">{item.completedReservations}</span>
                              <span id="total">of {item.maximumReservations}</span>
                            </div>
                          </div>
                        )) : (
                          <div className="no-time-slot-founds">
                            <i className="hm-calendar" />
                            <div className="content-for-no-ts">
                              <p>There’s no available time for the selected date.</p>
                            </div>
                          </div>
                        )}
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
          <Button className="book-offer" size="smaller" color="translucent" onClick={handleCLoseDetailsModal}>
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
      <Modal
        hasCloseButton
        isOpen={openQrModal}
        onClose={handleCLoseWCModal}
        onEnter={openModal ? handleCLoseWCModal : undefined}
        className="WalletQrModal"
        title="Wallet Connect"
      >
        {loadingQr && (
          <div className="spinner-holder">
            <Spinner color="blue" />
          </div>
        )}
        <div key="qr-container" className="qr-container pre-animate" ref={qrCodeRef} />
      </Modal>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (): any => {
    return {
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'showNotification',
  ]),
)(BookOfferDialog));
