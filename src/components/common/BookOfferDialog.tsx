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
import getWalletBalanceByAddress from './helpers/walletBalanceHelper';
import editImage from '../../assets/heymate/edit.svg';
import hmlogo from '../../assets/heymate/heymate-logro-ounded.png';

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
  SetDevices,
}
enum PaymentMethod {
  'WALLETCONNECT' = 'WALLETCONNECT',
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
  const [actionTitle, setActionTitle] = useState('Schedule a time');
  const [currentStep, setCurrentStep] = useState('time');
  const [userCurrentPaymentMethod, setUserCurrentPaymentMethod] = useState('');
  const [userHasDefaultDevice, setUserHasDefaultDevice] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const tabs = [
    { type: BookOfferModalTabs.TIME_SLOTS, title: 'Time Slots' },
    { type: BookOfferModalTabs.CALENDAR, title: 'Calendar' },
    { type: BookOfferModalTabs.SetPaymentMethod, title: 'Payment Method' },
    { type: BookOfferModalTabs.SetDevices, title: 'Select Device' },
  ];

  const PAYMENT_METHODS: IRadioOption[] = [{
    label: 'Wallet Connect',
    value: 'WALLETCONNECT',
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
    if (currentStep === 'purchase-type') {
      heymateUser?.devices.forEach(async (device: any) => {
        const balance = await getWalletBalanceByAddress(device.walletAddress);
        device.balance = balance;
      });
    }
    if (heymateUser?.paymentMethod === PaymentMethod.PUSH) {
      setUserCurrentPaymentMethod('PUSH');
      setSelectedPaymentMethod(PaymentMethod.PUSH);
    } else if (heymateUser?.paymentMethod === PaymentMethod.WALLETCONNECT) {
      setUserCurrentPaymentMethod('WALLETCONECT');
      setSelectedPaymentMethod(PaymentMethod.WALLETCONNECT);
    }
    if (heymateUser?.transactionDefaultDevice) {
      setUserHasDefaultDevice(true);
    }
  }, [heymateUser, currentStep]);

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

    await setDefaultPaymentMethod(PaymentMethod.WALLETCONNECT);

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

        offerStartTime: activeTs?.fromTs,
        offerPrice: offer.pricing.price,
        offerProvider: offer?.provider?.fullName,
        offerTitle: offer.title.toString(),

      },
    });
    showNotification({ message: 'Push Send To the device!' });
    if (response.status === 200 || response.status === 201) {
      setCurrentStep('accept');
      setActionTitle('Payment Request sent to your phone');
      // handleCLoseDetailsModal();
      // showNotification({ message: 'Please Accept request on your device!' });
    } else {
      showNotification({ message: 'Failed To send the push !' });
    }
  };

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleOpenCalendarModal = () => {
    setIsCalendarOpen(true);
  };

  const handleSelectedMethod = useCallback((value: any) => {
    setSelectedPaymentMethod((value.currentTarget.defaultValue) as PaymentMethod);
  }, []);

  const handleBookOffer = async () => {
    let planId;
    if (purchasePlanType !== 'SINGLE') {
      const plan = await purchaseAPlan();
      if (plan) {
        planId = plan.id;
      }
    }
    if (currentStep === 'time') {
      setCurrentStep('purchase-type');
      setActionTitle('Select payment method');
      setCurrentStep('purchase-type');
      return;
    }

    if (typeof heymateUser?.paymentMethod === 'undefined'
      || heymateUser?.paymentMethod === PaymentMethod.NOTSET || editMode) {
    // if (true) {
      if (selectedPaymentMethod === PaymentMethod.PUSH) {
        setBookOfferLoading(true);
        await setDefaultPaymentMethod(PaymentMethod.PUSH);
        setUserDefaultDevice().then(async (res) => {
          showNotification({ message: 'Default User Device Has Set !' });
          await bookOfferByPush();
          setBookOfferLoading(false);
        }).catch((err) => {
          console.log(err);
          setBookOfferLoading(false);
          alert('failed to set default device');
        });
      } else {
        await setDefaultPaymentMethod(PaymentMethod.WALLETCONNECT);
        bookOfferByWalletConnect();
      }
    } else if (heymateUser?.paymentMethod === PaymentMethod.PUSH) {
      await bookOfferByPush();
    } else if (heymateUser?.paymentMethod === PaymentMethod.WALLETCONNECT) {
      await bookOfferByWalletConnect();
    }
  };

  const handleSelectedDevice = (event: ChangeEvent<HTMLInputElement>, device: any) => {
    setSelectedDevice(device);
  };

  // useEffect(() => {
  //   switch (selectedPaymentMethod) {
  //     case PaymentMethod.WALLETCONNECT:
  //       bookOfferByWalletConnect();
  //       break;
  //     case PaymentMethod.PUSH:
  //       handleSwitchTab(3);
  //       setCallToActionName({
  //         name: 'Send Push',
  //         value: 'PUSH',
  //       });
  //       break;
  //     case PaymentMethod.NOTSET:
  //       console.log(selectedPaymentMethod);
  //       break;
  //   }
  // }, [selectedPaymentMethod]);

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

  const handleEditBtn = (type: string) => {
    setEditMode(true);
    if (type === 'method') {
      setUserCurrentPaymentMethod('');
      setSelectedPaymentMethod(PaymentMethod.NOTSET);
    } else if (type === 'device') {
      setUserHasDefaultDevice(false);
    }
  };

  return (
    <div>
      <Modal
        hasCloseButton
        isOpen={openModal}
        onClose={handleCLoseDetailsModal}
        onEnter={openModal ? handleCLoseDetailsModal : undefined}
        className="BookOfferModal"
        title={actionTitle}
      >
        <div className="book-offer-content">
          {currentStep === 'time'
            ? (
              <div className="TimeSlots">
                <div className="time-slots-picker">
                  <span id="caption">Date</span>
                  <div className="calendar-wrapper" onClick={handleOpenCalendarModal}>
                    <span
                      id="time-picker"

                    >{selectedDate}
                    </span>
                    <i className="icon-calendar" />
                  </div>
                </div>
                <div className="time-slots-rows custom-scroll">
                  <span id="caption">Hours</span>
                  {filteredDate.length > 0 ? filteredDate.map((item) => (
                    <div
                      className={buildClassName('time-slot-row',
                        (selectedTimeSlotId === item.id) && 'active')}
                    >
                      <div>
                        <Radio
                          name={item.id}
                          label={`${selectedDate === 'All' ? `${item.date} - ` : ''}
                           ${item.fromDateLocal} - ${item.toDateLocal}`}
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
            )
            : currentStep === 'purchase-type' ? (
              <div className="payment-radio">
                <span className="title">Payment Method</span>
                {
                  userCurrentPaymentMethod === 'WALLETCONECT' ? (
                    <div className="default-row">
                      <div className="default-row--title">
                        <span>Wallet Connect</span>
                        <img src={editImage} alt="" onClick={() => handleEditBtn('method')} />
                      </div>
                      <p>Scan QR code to complete payment</p>
                    </div>
                  ) : userCurrentPaymentMethod === 'PUSH' ? (
                    <div className="default-row">
                      <div className="default-row--title">
                        <span>Heymate Wallet (by push)</span>
                        <img src={editImage} alt="" onClick={() => handleEditBtn('method')} />
                      </div>
                      <p>Send payment request to your phone to complete payment</p>
                    </div>
                  ) : (
                    <><Radio
                      name="paymentMethod"
                      label="Wallet Connect"
                      value="WALLETCONNECT"
                      checked={selectedPaymentMethod === PaymentMethod.WALLETCONNECT}
                      onChange={handleSelectedMethod}
                    /><p>Scan QR code to complete payment</p><Radio
                      name="paymentMethod"
                      label="Heymate Wallet (by push)"
                      value="PUSH"
                      checked={selectedPaymentMethod === PaymentMethod.PUSH}
                      onChange={handleSelectedMethod}
                    /><p>Send payment request to your phone to complete payment</p>
                    </>
                  )
                }

                {selectedPaymentMethod === PaymentMethod.PUSH && (
                  <div>
                    <span className="title">Device Type</span>
                    {
                      userHasDefaultDevice && (
                        <div className="default-row devices-edit">
                          <div className="default-row--title">
                            <span>{heymateUser?.transactionDefaultDevice.deviceName}</span>
                            <img src={editImage} alt="" onClick={() => handleEditBtn('device')} />
                          </div>
                          <div className="address-balance">
                            {heymateUser?.transactionDefaultDevice?.balance?.cUSD}
                          </div>
                        </div>
                      )
                    }
                    {!userHasDefaultDevice && heymateUser?.devices.map((device) => (
                      <div className="push-devices">
                        <Radio
                          name="push-devices"
                          label={device.deviceName}
                          value={device.deviceUUID}
                          checked={selectedTimeSlotId === device.deviceUUID}
                          onChange={(e) => handleSelectedDevice(e, device)}
                        />
                        <div className="address-balance">
                          {device.balance?.cUSD}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
              : (
                <div className='accept-part'>
                  <img src={hmlogo} alt="heymate-logo" />
                  <div className='accept-part--desc'>
                    <span className='accept-part--desc--title'>Perform the following steps to complete your order</span>
                    <span className='accept-part--desc--body'> >  Open the App, accept the payment request</span>
                    <span className='accept-part--desc--body'> > Enter your pin and wait confirmation</span>
                    <span className='accept-part--desc--body'> > Please do not close the application</span>
                  </div>
                </div>
              )}
        </div>

        {currentStep !== 'accept' && (
          <div className="btn-group">
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
              {/* {callToActionName.name} */}
              {currentStep === 'time' ? 'Next' : currentStep === 'purchase-type' ? 'Make Payment' : ''}
            </Button>
          </div>
        )}
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
