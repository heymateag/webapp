import React, {
  FC, memo, useEffect, useState, useRef, useMemo,
} from 'teact/teact';
import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import QrCreator from 'qr-creator';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import { ReservationStatus } from '../../../../../types/HeymateTypes/ReservationStatus';
import Button from '../../../../ui/Button';
import { axiosService } from '../../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../../config';
import GenerateNewDate from '../../../helpers/generateDateBasedOnTimeStamp';
import OfferWrapper from '../../../../left/wallet/OfferWrapper';
import Modal from '../../../../ui/Modal';
import Spinner from '../../../../ui/Spinner';
import { GlobalActions } from 'src/global/types';
import { withGlobal } from 'teact/teactn';
import { pick } from '../../../../../util/iteratees';
import renderText from "../../../../common/helpers/renderText";
import useLang from "../../../../../hooks/useLang";

type TimeToStart = {
  days: number;
  hours: number;
  minutes: number;
};

type OwnProps = {
  timeToStart: TimeToStart;
  fromTime?: string;
  toTime?: string;
  status: ReservationStatus;
  onJoinMeeting: () => void;
  onStatusChanged: (status: ReservationStatus) => void;
  joinMeetingLoader: boolean;
  role?: 'CONSUMER' | 'SERVICE_PROVIDER';
  offerType: 'DEFAULT' | 'ONLINE';
  reservationId: string;
  offer: IOffer;
  tradeId: string;
};
type DispatchProps = Pick<GlobalActions, 'showNotification'>;


const OrderFooter: FC<OwnProps & DispatchProps> = ({
  timeToStart,
  fromTime,
  toTime,
  status,
  onJoinMeeting,
  joinMeetingLoader,
  role = 'CONSUMER',
  reservationId,
  onStatusChanged,
  offerType,
  offer,
  tradeId,
  showNotification,
}) => {
  const lang = useLang();

  const [reservationStatus, setReservationStatus] = useState(status);

  const [isLoading, setIsLoading] = useState(false);

  const [hasExpired, setHasExpired] = useState(false);

  const [canStart, setCanStart] = useState(false);

  const [canFinish, setCanFinish] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [uri, setUri] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);


  const [loadAcceptLoading, setLoadAcceptLoading] = useState(false);
  const [openAcceptModal, setOpenAcceptModal] = useState(false);

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

  useEffect(() => {
    if (fromTime && toTime) {
      const dateFutureFrom = GenerateNewDate(fromTime);
      const dateFutureToTime = GenerateNewDate(toTime);
      const dateNow = new Date();
      if ((dateFutureFrom.getTime() < dateNow.getTime())
        && (dateNow.getTime() < dateFutureToTime.getTime())) {
        setCanStart(true);
      } else {
        setCanStart(false);
      }
      if (dateNow.getTime() > dateFutureToTime.getTime()) {
        setCanFinish(true);
      }
    }
  }, [fromTime, toTime]);

  useEffect(() => {
    if (reservationStatus === ReservationStatus.STARTED) {
      setCanFinish(true);
    } else {
      setCanFinish(false);
    }
  }, [reservationStatus]);

  useEffect(() => {
    if (status !== reservationStatus) {
      setReservationStatus(status);
    }
  }, [reservationStatus, status]);

  const handleChangeReservationStatus = async (newStatus: ReservationStatus) => {
    setIsLoading(true);
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/${reservationId}`,
      method: 'PUT',
      body: {
        status: newStatus,
      },
    });
    setIsLoading(false);
    if (response?.status === 200) {
      setReservationStatus(newStatus);
      onStatusChanged(newStatus);
    }
    if (offerType === 'ONLINE' && (newStatus === ReservationStatus.STARTED)) {
      onJoinMeeting();
    }
  };

  const renderUriAsQr = (givenUri?) => {
    setOpenModal(true);
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
    setOpenModal(true);
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

  const handleStartInCelo = async () => {
    setIsLoading(true);
    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
        setIsConnected(true);
        setOpenModal(false);
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
      const answer = await offerWrapper.startService(offer, tradeId, address);
      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      if (answer?.message?.startsWith('Error')) {
        setIsLoading(false);
        showNotification({ message: answer.message });
        return;
      }
      if (answer) {
        handleChangeReservationStatus(ReservationStatus.STARTED);
      } else {
        console.log('failed');
      }
    } else {
      handleOpenWCModal();
    }
  };

  const handleFinishInCelo = async () => {
    setIsLoading(true);
    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
        setIsConnected(true);
        setOpenModal(false);
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
      const answer = await offerWrapper.finishService(offer, tradeId, address);
      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      if (answer?.message?.startsWith('Error')) {
        setIsLoading(false);
        showNotification({ message: answer.message });
        return;
      }
      if (answer) {
        handleChangeReservationStatus(ReservationStatus.FINISHED);
      } else {
        console.log('failed');
      }
    } else {
      handleOpenWCModal();
    }
  };

  const handleCLoseWCModal = () => {
    setOpenModal(false);
    provider.isConnecting = false;
    setLoadingBalance(false);
  };

  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setLoadAcceptLoading(false);
  };

  return (
    <div className="offer-footer">
      <div className="date-time">
        {reservationStatus === ReservationStatus.BOOKED && (
          <div className={ReservationStatus.BOOKED}>
            <i className="hm-date-time" />
            {
              (timeToStart?.days === 0 && timeToStart.hours === 0 && timeToStart.minutes === 0) ? (
                <span>Waiting for start</span>
              ) : (
                <div>
                  <span>{`${timeToStart?.days} days `}</span>
                  <span>{` ${timeToStart?.hours}:${timeToStart?.minutes} to start`}</span>
                </div>
              )
            }
          </div>
        )}
        {reservationStatus === ReservationStatus.MARKED_AS_STARTED && (
          <div className={ReservationStatus.MARKED_AS_STARTED}>
            <i className="hm-time" />
            <span>Waiting for your confirmation</span>
          </div>
        )}
        {reservationStatus === ReservationStatus.STARTED && (
          <div className={ReservationStatus.STARTED}>
            <i className="hm-play" />
            <span>In progress</span>
            <span>{`${timeToStart?.days}:${timeToStart?.hours}:${timeToStart?.minutes}`}</span>
          </div>
        )}
        {reservationStatus === ReservationStatus.MARKED_AS_FINISHED && (
          <div className={ReservationStatus.MARKED_AS_FINISHED}>
            <i className="hm-time" />
            <span>Waiting for your confirm</span>
          </div>
        )}
        {reservationStatus === ReservationStatus.CANCELED_BY_SERVICE_PROVIDER && (
          <div className={ReservationStatus.CANCELED_BY_SERVICE_PROVIDER}>
            <i className="hm-play" />
            <span>Waiting for your Cancel confirmation</span>
          </div>
        )}
      </div>
      <div className="btn-holder">
        { (reservationStatus === ReservationStatus.MARKED_AS_FINISHED
          || reservationStatus === ReservationStatus.STARTED) && (
          <>
            <Button
              isLoading={isLoading}
              onClick={() => handleFinishInCelo()}
              size="tiny"
              color="hm-primary-red"
              disabled={reservationStatus === ReservationStatus.STARTED}
            >
              Confirm End
            </Button>
            <Button
              isLoading={joinMeetingLoader}
              onClick={onJoinMeeting}
              size="tiny"
              color="primary"
            >
              Re Join
            </Button>
          </>
        )}
        { (reservationStatus === ReservationStatus.BOOKED
          || reservationStatus === ReservationStatus.MARKED_AS_STARTED) && (
          <div className="btn-confirm">
            <Button
              isLoading={isLoading || joinMeetingLoader}
              // onClick={() => handleChangeReservationStatus(ReservationStatus.STARTED)}
              onClick={() => handleStartInCelo()}
              ripple
              size="tiny"
              color="primary"
              disabled={reservationStatus === ReservationStatus.BOOKED}
            >
              {offerType === 'DEFAULT' ? 'Confirm Start' : 'Join'}
            </Button>
          </div>
        )}
        { (role === 'SERVICE_PROVIDER' && reservationStatus === ReservationStatus.BOOKED)
        && (
          <div className="btn-cancel">
            <Button
              disabled={!canStart}
              isLoading={joinMeetingLoader}
              onClick={onJoinMeeting}
              size="tiny"
              color="primary"
            >
              Start
            </Button>
          </div>
        )}
        { (role === 'SERVICE_PROVIDER' && reservationStatus === ReservationStatus.BOOKED)
        && (
          <div className="btn-cancel">
            <Button
              disabled={!canStart}
              isLoading={joinMeetingLoader}
              onClick={onJoinMeeting}
              size="tiny"
              color="primary"
            >
              Start
            </Button>
          </div>
        )}
        { (role === 'SERVICE_PROVIDER' && reservationStatus === ReservationStatus.STARTED)
        && (
          <div className="btn-cancel">
            <Button
              disabled={!canFinish}
              isLoading={joinMeetingLoader}
              onClick={onJoinMeeting}
              size="tiny"
              color="hm-primary-red"
            >
              End
            </Button>
          </div>
        )}
      </div>
      <Modal
        hasCloseButton
        isOpen={openModal}
        onClose={handleCLoseWCModal}
        onEnter={openModal ? handleCLoseWCModal : undefined}
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
  (): any => {
    return {
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'showNotification',
  ]),
)(OrderFooter));
