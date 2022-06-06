import React, {
  FC, memo, useEffect, useState, useMemo,
} from 'teact/teact';
import { IOffer } from 'src/types/HeymateTypes/Offer.model';
// import QrCreator from 'qr-creator';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import { GlobalActions } from 'src/global/types';
import { withGlobal } from 'teact/teactn';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';
import { ReservationStatus } from '../../../../../types/HeymateTypes/ReservationStatus';
import Button from '../../../../ui/Button';
import { axiosService } from '../../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../../config';
import GenerateNewDate from '../../../helpers/generateDateBasedOnTimeStamp';
import OfferWrapper from '../../../../left/wallet/OfferWrapper';
import { pick } from '../../../../../util/iteratees';
// import QrCodeDialog from '../../../../common/QrCodeDialog';
import AcceptTransactionDialog from '../../../../common/AcceptTransactionDialog';
import { useWalletConnectQrModal } from '../../../../left/wallet/hooks/useWalletConnectQrModal';
import walletLoggerService from '../../../../common/helpers/walletLoggerService';
import { IHttpResponse } from '../../../../../types/HeymateTypes/HttpResponse.model';
import { IHeymateUser } from '../../../../../api/types';

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

type StateProps = {
  heymateUser?: IHeymateUser;
};

type DispatchProps = Pick<GlobalActions, 'showNotification'>;

const OrderFooter: FC<OwnProps & DispatchProps & StateProps> = ({
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
  heymateUser,
}) => {
  const [reservationStatus, setReservationStatus] = useState(status);

  const [isLoading, setIsLoading] = useState(false);

  const [canStart, setCanStart] = useState(false);

  const [canFinish, setCanFinish] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [uri, setUri] = useState<string>('');
  const [loadAcceptLoading, setLoadAcceptLoading] = useState(false);
  const [openAcceptModal, setOpenAcceptModal] = useState(false);

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

  const handleCLoseWCModal = () => {
    setOpenModal(false);
    setIsLoading(false);
    provider.isConnecting = false;
  };
  useWalletConnectQrModal(uri, openModal, handleCLoseWCModal);
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

  const handleOpenWCModal = async () => {
    if (uri === '') {
      await provider.enable();
    }
    setOpenModal(true);
  };
  /**
   * Get Account Data
  */
  provider.connector.on('display_uri', (err, payload) => {
    // setIsConnected(false);
    walletLoggerService({
      description: 'start connecting to wallet',
      status: 'Waiting',
    });
    const wcUri = payload.params[0];
    setUri(wcUri);
    setOpenModal(true);
  });
  provider.onConnect(() => {
    walletLoggerService({
      description: 'finish connecting to wallet',
      status: 'Success',
    });
    setOpenModal(false);
    showNotification({ message: 'Successfully Connected to Wallet !' });
    WalletConnectQRCodeModal.close();
  });

  const handleStartByPush = async () => {
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/notification-services/offer/transaction`,
      method: 'POST',
      body: {
        action: 'START',
        reservationId,
        tradeId,
      },
    });
    console.log('===============Start the zoom push Logs =======');
    if (offerType === 'ONLINE') {
      onJoinMeeting();
    }
    return response;
  };

  const handleFinishByPush = async () => {
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/notification-services/offer/transaction`,
      method: 'POST',
      body: {
        action: 'FINISH',
        reservationId,
        tradeId,
      },
    });
    console.log('===============Start the zoom push Logs =======');
    if (offerType === 'ONLINE') {
      onJoinMeeting();
    }
    return response;
  };

  const handleStartInCelo = async () => {
    setIsLoading(true);
    if (heymateUser?.paymentMethod === 'PUSH') {
      await handleStartByPush();
      setIsLoading(false);
    } else {
      let kit: ContractKit;
      let address: string = '';
      if (provider.isWalletConnect) {
        await provider.enable().then((res) => {
          // eslint-disable-next-line prefer-destructuring
          address = res[0];
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
        walletLoggerService({
          description: 'start accepting start',
          status: 'Waiting',
        });
        const answer = await offerWrapper.startService(offer, tradeId, address);
        setLoadAcceptLoading(false);
        setOpenAcceptModal(false);
        walletLoggerService({
          description: 'finish accepting start',
          status: 'Success',
        });
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
    }
  };

  const handleFinishInCelo = async () => {
    setIsLoading(true);
    if (heymateUser?.paymentMethod === 'PUSH') {
      await handleFinishByPush();
      setIsLoading(false);
    } else {
      let kit: ContractKit;
      let address: string = '';
      if (provider.isWalletConnect) {
        await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
          address = res[0];
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
        walletLoggerService({
          description: 'start accepting finish',
          status: 'Waiting',
        });
        const answer = await offerWrapper.finishService(offer, tradeId, address);
        setLoadAcceptLoading(false);
        setOpenAcceptModal(false);
        walletLoggerService({
          description: 'finish accepting finish',
          status: 'Success',
        });
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
    }
  };

  const handleCloseAcceptModal = () => {
    setIsLoading(false);
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
          <div className="btn-join-rejoin">
            <Button
              isLoading={isLoading}
              onClick={() => handleFinishInCelo()}
              size="tiny"
              color="hm-primary-red"
              className="confirm-end"
              disabled={reservationStatus === ReservationStatus.STARTED}
            >
              Confirm End
            </Button>
            {(offerType === 'ONLINE' && reservationStatus !== ReservationStatus.MARKED_AS_FINISHED) && (
              <Button
                isLoading={joinMeetingLoader}
                onClick={onJoinMeeting}
                size="tiny"
                color="primary"
              >
                Re Join
              </Button>
            )}
          </div>
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
      {/* <QrCodeDialog
        uri={uri}
        openModal={openModal}
        onCloseModal={handleCLoseWCModal}
        loadingQr={loadingQr}
        qrCodeRef={qrCodeRef}
      /> */}

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
)(OrderFooter));
