import React, {
  FC, memo, useCallback, useEffect, useState, useMemo,
} from 'teact/teact';
import { ChangeEvent } from 'react';
import { withGlobal } from 'teact/teactn';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { GlobalActions } from 'src/global/types';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';
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
// import QrCodeDialog from './QrCodeDialog';
import AcceptTransactionDialog from './AcceptTransactionDialog';
import { useWalletConnectQrModal } from '../left/wallet/hooks/useWalletConnectQrModal';
import walletLoggerService from './helpers/walletLoggerService';
import { ApiReportReason, IHeymateUser } from '../../api/types';
import RadioGroup, { IRadioOption } from '../ui/RadioGroup';
import { IHttpResponse } from '../../types/HeymateTypes/HttpResponse.model';

type OwnProps = {
  offer: IOffer;
  openModal: boolean;
  onCloseModal: () => void;
  purchasePlanType?: 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';
};
type StateProps = {
  heymateUser?: IHeymateUser;
};
type DispatchProps = Pick<GlobalActions, 'showNotification'>;

enum BookOfferModalTabs {
  TIME_SLOTS,
  CALENDAR,
  SetPaymentMethod,
}
enum PaymentMethod {
  'WALLECTCONNECT' = 'WALLECTCONNECT',
  'PUSH' = 'PUSH',
  'NOTSET' = 'NOTSET',
}

type CallToAction = {
  name: string;
  value: 'WC' | 'PUSH';
};

interface ITimeSlotsRender extends ITimeSlotModel{
  fromTs: number;
  toTs: number;
  fromDateLocal?: string;
  toDateLocal?: string;
  remainingReservations?: number;
  completedReservations?: number;
  maximumReservations?: number; // 0 means unlimited
  date?: string;
}

const BookOfferDialog: FC<OwnProps & DispatchProps & StateProps> = ({
  offer,
  openModal = false,
  onCloseModal,
  purchasePlanType = 'SINGLE',
  showNotification,
  heymateUser,
}) => {
  const lang = useLang();

  const [timeSlots, setTimeSlots] = useState<ITimeSlotsRender[]>([]);
  const [timeSlotList, setTimeSlotList] = useState<ITimeSlotsRender[]>([]);
  const [filteredDate, setFilteredDate] = useState<ITimeSlotsRender[]>([]);
  const [bookOfferLoading, setBookOfferLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [openQrModal, setOpenQRModal] = useState(false);
  const [uri, setUri] = useState<string>('');
  const [loadAcceptLoading, setLoadAcceptLoading] = useState(false);
  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.NOTSET);
  const [chooseMethodState, setChooseMethodState] = useState<'PAYMENT_METHOD' | 'SELECT_DEVICE'>('PAYMENT_METHOD');
  const [selectedDevice, setSelectedDevice] = useState<any>('');
  const [callToActionName, setCallToActionName] = useState<CallToAction>({
    name: 'Book Now',
    value: 'WC',
  });

  const tabs = [
    { type: BookOfferModalTabs.TIME_SLOTS, title: 'Time Slots' },
    { type: BookOfferModalTabs.CALENDAR, title: 'Calendar' },
    { type: BookOfferModalTabs.SetPaymentMethod, title: 'Payment Method' },
  ];

  const PAYMENT_METHODS: IRadioOption[] = [{
    label: 'Wallet Connect',
    value: 'WALLECTCONNECT',
  }, {
    label: 'By Push',
    value: 'PUSH',
  }];

  const provider = useMemo(() => {
    return new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      qrcode: false,
      bridge: 'https://wc-bridge.heymate.works/',
      clientMeta: {
        description: 'Just a test description !',
        icons: [],
        url: 'www.ehsan.com',
        name: 'Heymate App',
      },
    });
  }, []);

  const handleCLoseWCModal = () => {
    setOpenQRModal(false);
    provider.isConnecting = false;
  };

  useWalletConnectQrModal(uri, openQrModal, handleCLoseWCModal);

  const handleOpenWCModal = async () => {
    if (uri === '') {
      await provider.enable();
    }
    setOpenQRModal(true);
  };

  /**
   * Get Account Data
  */
  provider.connector.on('display_uri', (err, payload) => {
    walletLoggerService({
      description: 'start connecting wallet',
      status: 'Waiting',
    });
    const wcUri = payload.params[0];
    setUri(wcUri);
    setOpenQRModal(true);
  });
  provider.onConnect(() => {
    walletLoggerService({
      description: 'connected wallet',
      status: 'Success',
    });
    setOpenQRModal(false);
    showNotification({ message: 'Successfully Connected to Wallet !' });
    WalletConnectQRCodeModal.close();
  });
  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setLoadAcceptLoading(false);
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
          item.fromDateLocal = new Date(fromTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          item.toDateLocal = new Date(toTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          item.date = new Date(fromTs).toLocaleDateString('en');
          return item;
        });
        setTimeSlots(temp);
        setTimeSlotList(res.data);
        setFilteredDate(temp);
        // getTodayRawDateString(temp);
      });
    }
  }, [getTodayRawDateString, offer]);

  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('');

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>, data: any) => {
    setSelectedTimeSlot(data);
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

  const setDefaultPaymentMethod = async (method: PaymentMethod) => {
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/users/payment-method`,
      method: 'PATCH',
      body: {
        paymentMethod: method,
      },
    });
    showNotification({ message: 'Default Payment Method Has Set !' });
  };

  const bookOfferByWalletConnect = async () => {
    setBookOfferLoading(true);

    await setDefaultPaymentMethod(PaymentMethod.WALLECTCONNECT);

    const activeTs = timeSlotList.find((item) => item.id === selectedTimeSlotId);
    let kit: ContractKit;
    let address: string;
    let offerPurchase;
    if (provider.isWalletConnect) {
      await provider.enable()
        .then((res) => {
          // eslint-disable-next-line prefer-destructuring
          address = res[0];
          setOpenQRModal(false);
        });
      walletLoggerService({
        description: 'send create contract request',
        status: 'Waiting',
      });
      // @ts-ignore
      const web3 = new Web3(provider);
      // @ts-ignore
      kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      kit.defaultAccount = accounts[0];
      const mainNet = provider.chainId !== 44787;
      offerPurchase = new OfferPurchase(offer, activeTs, kit, provider.accounts[0], mainNet, web3);
      setLoadAcceptLoading(true);
      setOpenAcceptModal(true);
      const response = await offerPurchase.purchase();
      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      setBookOfferLoading(false);
      if (!response) {
        return;
      }
      if (response.status === 201) {
        showNotification({ message: 'Offer Booked Successfuly !' });
        handleCLoseDetailsModal();
      } else if (response.status === 406) {
        showNotification({ message: response.data.message });
        setBookOfferLoading(false);
      } else {
        showNotification({ message: 'Some thing went wrong !' });
        setBookOfferLoading(false);
      }
    } else {
      handleOpenWCModal();
    }
  };

  const setUserDefaultDevice = async () => {
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/users/updateTransactionDefaultDevice`,
      method: 'PATCH',
      body: selectedDevice,
    });
    return response;
  };

  const bookOfferByPush = async () => {
    const activeTs = timeSlotList.find((item) => item.id === selectedTimeSlotId);
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/notification-services/offer/transaction`,
      method: 'POST',
      body: {
        action: 'BOOK',
        offerId: offer.id,
        timeSlotId: activeTs?.id,
      },
    });
    showNotification({ message: 'Push Send To the device!' });
    debugger
    if (response.data.data.failed.length === 0) {
      const data = {
        offerId: offer.id,
        serviceProviderId: offer.userId,
        purchasedPlanId: undefined,
        timeSlotId: activeTs?.id,
        tradeId: '1234',
        consumer_wallet_address: selectedDevice.walletAddress,
      };
      const response = await axiosService({
        url: `${HEYMATE_URL}/reservation`,
        method: 'POST',
        body: data,
      });
      handleCLoseDetailsModal();
      showNotification({ message: 'Offer Booked Successfuly !' });
    } else {
      showNotification({ message: 'Failed To send the push !' });
    }
  };

  const [activeTab, setActiveTab] = useState<BookOfferModalTabs>(BookOfferModalTabs.TIME_SLOTS);

  const handleSwitchTab = useCallback((index: number) => {
    setActiveTab(index); // Uncomment to calendar tab works
  }, []);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleOpenCalendarModal = () => {
    setIsCalendarOpen(true);
  };

  const handleSelectedMethod = useCallback((value: string) => {
    setSelectedPaymentMethod(value as PaymentMethod);
  }, []);

  const handleBookOffer = async () => {
    let planId;
    if (purchasePlanType !== 'SINGLE') {
      const plan = await purchaseAPlan();
      if (plan) {
        planId = plan.id;
      }
    }

    if (typeof heymateUser?.paymentMethod === 'undefined' ||
      heymateUser?.paymentMethod === PaymentMethod.NOTSET) {
      if (callToActionName.value === 'PUSH') {
        await setDefaultPaymentMethod(PaymentMethod.PUSH);
        setUserDefaultDevice().then(async (res) => {
          showNotification({ message: 'Default User Device Has Set !' });
          await bookOfferByPush();
        }).catch((err) => {
          console.log(err);
          alert('failed to set default device');
        });
      } else {
        handleSwitchTab(2);
      }
    } else if (heymateUser?.paymentMethod === PaymentMethod.PUSH) {
      await bookOfferByPush();
    } else if (heymateUser?.paymentMethod === PaymentMethod.WALLECTCONNECT) {
      await bookOfferByWalletConnect();
    }
  };

  const handleSelectedDevice = (event: ChangeEvent<HTMLInputElement>, device: any) => {
    setSelectedDevice(device);
  };

  useEffect(() => {
    switch (selectedPaymentMethod) {
      case PaymentMethod.WALLECTCONNECT:
        bookOfferByWalletConnect();
        break;
      case PaymentMethod.PUSH:
        setChooseMethodState('SELECT_DEVICE');
        setCallToActionName({
          name: 'Send Push',
          value: 'PUSH',
        });
        break;
      case PaymentMethod.NOTSET:
        console.log(selectedPaymentMethod);
        break;
    }
  }, [selectedPaymentMethod]);

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
          <TabList activeTab={activeTab} tabs={tabs} onSwitchTab={() => {}} />
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
                        <div className="calendar-wrapper">
                          <i className="icon-calendar" />
                          <span
                            id="time-picker"
                            onClick={handleOpenCalendarModal}
                          >{selectedDate}
                          </span>
                        </div>

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
                                label={`${item.date} - ${item.fromDateLocal} - ${item.toDateLocal}`}
                                value={item.id}
                                checked={selectedTimeSlotId === item.id}
                                onChange={(e) => handleChange(e, item)}
                              />
                            </div>
                            {item.completedReservations && item.completedReservations > 10000 ? (
                              <div className="remaining-of-total">
                                <span id="remaining">{item.completedReservations}</span>
                                <span id="total">  of {item.maximumReservations}</span>
                              </div>
                            ) : (
                              <div className="remaining-of-total">
                                unlimited
                              </div>
                            )}
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
                case BookOfferModalTabs.SetPaymentMethod:
                  if (chooseMethodState === 'PAYMENT_METHOD') {
                    return (
                      <div>
                        <RadioGroup
                          name="paymentMethod"
                          options={PAYMENT_METHODS}
                          selected={selectedPaymentMethod}
                          onChange={handleSelectedMethod}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        {heymateUser?.devices.map((device) => (
                          <Radio
                            name={device.deviceUUID}
                            label={device.deviceName}
                            value={device.deviceUUID}
                            checked={selectedTimeSlotId === device.deviceUUID}
                            onChange={(e) => handleSelectedDevice(e, device)}
                          />
                        ))}

                      </div>
                    );
                  }

                default:
                  return (
                    <div>There’s no available time for the selected date</div>
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
            disabled={
              !selectedTimeSlotId || (selectedTimeSlot.completedReservations >= selectedTimeSlot.maximumReservations)
            }
          >
            {callToActionName.name}
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
      {/* <QrCodeDialog */}
      {/*  uri={uri} */}
      {/*  openModal={openQrModal} */}
      {/*  onCloseModal={handleCLoseWCModal} */}
      {/*  loadingQr={loadingQr} */}
      {/*  qrCodeRef={qrCodeRef} */}
      {/* /> */}
      <AcceptTransactionDialog
        isOpen={openAcceptModal}
        onCloseModal={handleCloseAcceptModal}
        loadAcceptLoading={loadAcceptLoading}
      />

    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { heymateUser } = global;
    return {
      heymateUser,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'showNotification',
  ]),
)(BookOfferDialog));
