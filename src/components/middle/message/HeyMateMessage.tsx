import { withGlobal } from 'teact/teactn';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import { ReservationModel } from 'src/types/HeymateTypes/Reservation.model';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import QrCreator from 'qr-creator';
import { encode } from 'js-base64';
import React, {
  FC, memo, useCallback, useEffect, useState, useMemo, useRef,
} from '../../../lib/teact/teact';

import RadioGroup from '../../ui/RadioGroup';
import Button from '../../ui/Button';
import { ApiMessage } from '../../../api/types';
import { axiosService } from '../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../config';
import { IOffer } from '../../../types/HeymateTypes/Offer.model';
import OfferDetailsDialog from '../../common/OfferDetailsDialog';
import BookOfferDialog from '../../common/BookOfferDialog';
import { ReservationStatus } from '../../../types/HeymateTypes/ReservationStatus';
import './HeyMateMessage.scss';
// eslint-disable-next-line import/extensions
import GenerateNewDate from '../helpers/generateDateBasedOnTimeStamp';
import { ZoomClient } from '../../main/components/ZoomSdkService/ZoomSdkService';

import { pick } from '../../../util/iteratees';
import { GlobalActions } from '../../../global/types';

import Modal from '../../ui/Modal';
import Spinner from '../../ui/Spinner';

import OfferWrapper from '../../left/wallet/OfferWrapper';
// @ts-ignore
import noOfferImg from '../../../assets/heymate/no-offer-image.svg';
import renderText from '../../common/helpers/renderText';
import useLang from '../../../hooks/useLang';

type OwnProps = {
  message: ApiMessage;
};
type DispatchProps = Pick<GlobalActions, 'openZoomDialogModal'>;
interface IPurchasePlan {
  value: string;
  label: string;
  subLabel: string;
}
type PlanType = 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';

const HeyMateMessage: FC<OwnProps & DispatchProps> = ({
  message,
  openZoomDialogModal,
}) => {
  const lang = useLang();

  const [renderType, setRenderType] = useState<'OFFER' | 'RESERVATION'>('OFFER');
  const [offerMsg, setOfferMsg] = useState<IOffer>();
  const [offerLoaded, setOfferLoaded] = useState<boolean>(false);
  const [reservationLoaded, setReservationLoaded] = useState<boolean>(false);
  const [reservationId, setReservationId] = useState<string>('');
  const [reservationItem, setReservationItem] = useState<ReservationModel>('');
  const [purchasePlan, setPurchasePlan] = useState<IPurchasePlan[]>([]);

  const [joinMeetingLoader, setJoinMeetingLoader] = useState(false);
  const [canJoin, setCanJoin] = useState(false);

  const [bundlePrice, setBundlePrice] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const [meetingData, setMeetingData] = useState<any>(undefined);

  const [openQrModal, setOpenQRModal] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [uri, setUri] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  // eslint-disable-next-line no-null/no-null
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const [loadAcceptLoading, setLoadAcceptLoading] = useState(false);
  const [openAcceptModal, setOpenAcceptModal] = useState(false);

  const handleExpired = (expireTime: any) => {
    const now = new Date();
    const startTime = GenerateNewDate(expireTime);
    if (now.getTime() < startTime.getTime()) {
      setIsExpired(false);
    } else {
      setIsExpired(true);
    }
  };

  async function getOfferById(uuid) {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/${uuid}`,
      method: 'GET',
      body: {},
    });
    if (response && response.status === 200) {
      handleExpired(response.data.data.expiration);
      setOfferLoaded(true);
      setOfferMsg(response.data.data);
    } else {
      setOfferLoaded(false);
    }
  }

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

  const getReservationMeta = async (rsId: string) => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/meta/${rsId}`,
      method: 'GET',
      body: {},
    });
    if (response.status === 200) {
      const { data } = response.data;

      if (data.status === ReservationStatus.MARKED_AS_STARTED) {
        setCanJoin(true);
        setReservationId(data.id);
      } else {
        setCanJoin(false);
      }

      setMeetingData({
        title: data.offer.title,
        topic: data.meetingId,
        pass: data.meetingPassword,
        tsId: data.time_slot.id,
        telegramId: data.user.telegramId,
        userName: data.user.fullName,
      });
      setReservationLoaded(true);
    }
  };

  useEffect(() => {
    let offerId;
    if (message.content.text?.text.includes('https://heymate.works/reservation')) {
      setRenderType('RESERVATION');

      const matches = message.content.text?.text.split(/reservation\/([a-f\d-]+)\?/);

      if (matches.length >= 2) {
        const rsId = matches[1];
        getReservationMeta(rsId);
      } else {
        setReservationLoaded(false);
      }
    } else {
      const matches = message.content.text?.text.split(/offer\/([a-f\d-]+)\?/);
      if (matches && matches.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        offerId = matches[1];
        getOfferById(offerId);
      }
    }
  }, [message]);

  const [selectedReason, setSelectedReason] = useState('single');
  const handleSelectType = useCallback((value: string) => {
    setSelectedReason(value);
  }, []);

  useEffect(() => {
    if (offerMsg && purchasePlan.length === 0) {
      const temp: IPurchasePlan[] = [];
      if (offerMsg?.pricing?.bundle || offerMsg?.pricing?.subscription) {
        if (offerMsg.pricing) {
          temp.push({
            label: 'Single',
            value: 'single',
            subLabel: '1 Session',
          });
        }
        // if (offerMsg.pricing.bundle) {
        //   let total = offerMsg.pricing.bundle.count * offerMsg.pricing.price;
        //   let discount = 0;
        //   if (offerMsg.pricing.bundle.discount_percent) {
        //     discount = (total * offerMsg.pricing.bundle.discount_percent) / 100;
        //   }
        //   total -= discount;
        //   setBundlePrice(total);
        //   temp.push({
        //     label: 'Bundle',
        //     value: 'bundle',
        //     subLabel: `${offerMsg.pricing.bundle.count} Sessions`,
        //   });
        // }
        // if (offerMsg.pricing.subscription) {
        //   temp.push({
        //     label: 'Subscription',
        //     value: 'subscription',
        //     subLabel: `${offerMsg.pricing.subscription.period}`,
        //   });
        // }
        setPurchasePlan(temp);
      }
    }
  }, [purchasePlan, offerMsg]);
  /**
   * Heymate Message Type
   */
  // ============== Offer Details Modal
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const handleCLoseDetailsModal = () => {
    setOpenDetailsModal(false);
  };
  const handleOpenDetailsModal = () => {
    setOpenDetailsModal(true);
  };
  // ============ Book Offer Modal
  const [openBookOfferModal, setOpenBookOfferModal] = useState(false);
  const handleCLoseBookOfferModal = () => {
    setOpenBookOfferModal(false);
  };
  const handleOpenBookOfferModal = () => {
    setOpenBookOfferModal(true);
  };

  const [planType, setPlanType] = useState<PlanType>('SINGLE');

  const handleBookOfferClicked = (plan: PlanType) => {
    setPlanType(plan);
    setOpenDetailsModal(false);
    setOpenBookOfferModal(true);
  };

  const joinMeeting = async () => {
    const meetingId = meetingData.topic;
    const sessionPassword = meetingData.pass;

    let userData:any = {
      f: meetingData.userName,
      i: meetingData.telegramId,
    };
    userData = JSON.stringify(userData);
    userData = encode(userData);

    const client = new ZoomClient(meetingId, sessionPassword, userData);
    setJoinMeetingLoader(true);
    await client.join();

    openZoomDialogModal({
      openModal: true,
      stream: client.mediaStream,
      zoomClient: client.zmClient,
      isLoading: joinMeetingLoader,
      reservationId,
      userType: 'CONSUMER',
    });

    setJoinMeetingLoader(false);
  };

  const handleChangeReservationStatus = async (id: string, newStatus: ReservationStatus) => {
    // setIsLoading(true);
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/${reservationId}`,
      method: 'PUT',
      body: {
        status: newStatus,
      },
    });
    // setIsLoading(false);
    if (response?.status === 200) {
      joinMeeting();
    }
  };

  const handleStartInCelo = async () => {
    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
        setIsConnected(true);
        setOpenQRModal(false);
      });
      // @ts-ignore
      const web3 = new Web3(provider);
      // @ts-ignoreffer
      kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      kit.defaultAccount = accounts[0];
      const mainNet = provider.chainId !== 44787;
      const offerWrapper = new OfferWrapper(address, kit, mainNet, provider);
      setLoadAcceptLoading(true);
      setOpenAcceptModal(true);
      const answer = await offerWrapper.startService(offerMsg, reservationItem.tradeId, address);
      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      if (answer) {
        handleChangeReservationStatus(reservationItem.id, ReservationStatus.STARTED);
      } else {
        console.log('failed');
      }
    } else {
      handleOpenWCModal();
    }
  };

  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setLoadAcceptLoading(false);
  };

  // @ts-ignore
  return (
    <div>
      { (renderType === 'OFFER') && offerLoaded && (
        <>
          <div className="HeyMateMessage">
            <div className="my-offer-body">
              <div className="my-offer-img-holder">
                { (offerMsg?.media && offerMsg?.media[0]) ? (
                  <img src={offerMsg?.media[0]?.previewUrl} crossOrigin="anonymous" alt="" />
                ) : (
                  <img src={noOfferImg} alt="no-img" />
                )}
              </div>
              <div className="my-offer-descs">
                <h4 className="title">{offerMsg?.title}</h4>
                <span className="sub-title">{offerMsg?.category.main_cat}</span>
                <p className="description">
                  {offerMsg?.description}
                </p>
              </div>
              <div className="my-offer-types">
                <div className="radios-grp">
                  <RadioGroup
                    name="report-message"
                    options={purchasePlan}
                    onChange={handleSelectType}
                    selected={selectedReason}
                  />
                </div>
                <div className="price-grp">
                  <span className="prices active">{`${offerMsg?.pricing?.price} ${offerMsg?.pricing?.currency}`}</span>
                  {/* <span className="prices">{`${bundlePrice}  ${offerMsg?.pricing?.currency}`}</span> */}
                  {/* <span className="prices"> */}
                  {/*  {`${offerMsg?.pricing?.subscription?.subscription_price}  ${offerMsg?.pricing?.currency}`} */}
                  {/* </span> */}
                </div>
              </div>
              {/* <div className="refer-offer"> */}
              {/*  <div className="refer-offer-container"> */}
              {/*    <i className="hm-gift" /> */}
              {/*    <span>Refer this offer to and eran <i className="gift-price">$10</i></span> */}
              {/*    <i className="hm-arrow-right" /> */}
              {/*  </div> */}
              {/* </div> */}
            </div>
            <div className="my-offer-btn-group">
              <Button onClick={handleOpenDetailsModal} className="see-details" size="smaller" color="secondary">
                See Details
              </Button>
              <Button
                disabled={isExpired}
                onClick={handleOpenBookOfferModal}
                className="book-offer"
                size="smaller"
                color="primary"
              >
                <span>Book Now</span>
              </Button>
            </div>
          </div>
          <BookOfferDialog
            purchasePlanType={planType}
            offer={offerMsg}
            openModal={openBookOfferModal}
            onCloseModal={handleCLoseBookOfferModal}
          />
          <OfferDetailsDialog
            onBookClicked={handleBookOfferClicked}
            message={message}
            openModal={openDetailsModal}
            offer={offerMsg}
            expired={isExpired}
            onCloseModal={handleCLoseDetailsModal}
          />
        </>
      )}
      {(renderType === 'OFFER') && !offerLoaded && (
        <div
          className="message-content text has-action-button
            is-forwarded has-shadow has-solid-background has-appendix"
        >
          <span className="normal-message">{message.content.text?.text}</span>
        </div>
      )}
      {
        (renderType === 'RESERVATION') && reservationLoaded && (
          <div className="HeyMateMessage">
            <div className="my-offer-body">
              <div className="my-offer-descs">
                <h4 className="title">Your Meeting :</h4>
                <span className="sub-title">{meetingData.title}</span>
                <p className="description">
                  has started, click join button to start !
                </p>
              </div>
            </div>
            <div className="my-offer-btn-group">
              <Button
                isLoading={joinMeetingLoader}
                disabled={!canJoin}
                onClick={handleStartInCelo}
                className="book-offer"
                size="smaller"
                color="primary"
              >
                <span>Join</span>
              </Button>
            </div>
          </div>
        )
      }
      {
        (renderType === 'RESERVATION') && !reservationLoaded && (
          <div
            className="message-content text has-action-button
              is-forwarded has-shadow has-solid-background has-appendix"
          >
            <span className="normal-message">{message.content.text?.text}</span>
          </div>
        )
      }
      <Modal
        hasCloseButton
        isOpen={openQrModal}
        onClose={handleCLoseWCModal}
        onEnter={openQrModal ? handleCLoseWCModal : undefined}
        className="WalletQrModal"
        title="Scan qrCode with your phone"
      >
        {loadingQr && (
          <div className="spinner-holder">
            <Spinner color="blue" />
          </div>
        )}
        <div key="qr-container" className="qr-container pre-animate" ref={qrCodeRef} />
        <div className="connection-notes">
          <h4>{lang('Connect.Wallet.Title')}</h4>
          <ol>
            <li><span>{lang('Connect.Wallet.Help1')}</span></li>
            <li><span>{renderText(lang('Connect.Wallet.Help2'), ['simple_markdown'])}</span></li>
            <li><span>{lang('Connect.Wallet.Help3')}</span></li>
          </ol>
        </div>
      </Modal>

      <Modal
        hasCloseButton
        isOpen={openAcceptModal}
        onClose={handleCloseAcceptModal}
        onEnter={openAcceptModal ? handleCloseAcceptModal : undefined}
        className="WalletQrModal"
        title="accept transaction in your phone to continue"
      >
        {loadAcceptLoading && (
          <div className="spinner-holder aproval-loader">
            <Spinner color="blue" />
          </div>
        )}
        <div className="connection-notes">
          <h4>{lang('Connect.Approve.Title')}</h4>
          <ol>
            <li><span>{lang('Connect.Approve.Help1')}</span></li>
            <li><span>{renderText(lang('Connect.Approve.Help2'), ['simple_markdown'])}</span></li>
            <li><span>{lang('Connect.Approve.Help3')}</span></li>
          </ol>
        </div>
      </Modal>

    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  () => {
    return {
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'openZoomDialogModal',
  ]),
)(HeyMateMessage));
