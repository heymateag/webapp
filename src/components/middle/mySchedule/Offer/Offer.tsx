import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { encode } from 'js-base64';
import { withGlobal } from 'teact/teactn';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3 from 'web3';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';
import React, {
  FC,
  memo,
  useCallback,
  useEffect, useMemo,
  useRef,
  useState,
} from '../../../../lib/teact/teact';
import useLang from '../../../../hooks/useLang';
import Button from '../../../ui/Button';

import { ReservationStatus } from '../../../../types/HeymateTypes/ReservationStatus';
import './Offer.scss';
import OfferDetailsDialog from '../../../common/OfferDetailsDialog';
// @ts-ignore
import noOfferImg from '../../../../assets/heymate/no-offer-image.svg';
import TaggedText from '../../../ui/TaggedText';
import MenuItem from '../../../ui/MenuItem';
import Menu from '../../../ui/Menu';
import OfferFooter from './components/OfferFooter';
import { ClientType } from '../../../main/components/ZoomSdkService/types';
import { ZoomClient } from '../../../main/components/ZoomSdkService/ZoomSdkService';
import GenerateNewDate from '../../helpers/generateDateBasedOnTimeStamp';
import { ApiUser, IHeymateUser } from '../../../../api/types';
import { GlobalActions } from '../../../../global/types';
import { selectUser } from '../../../../modules/selectors';
import { pick } from '../../../../util/iteratees';
import { axiosService } from '../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../config';
import Avatar from '../../../common/Avatar';
import { useWalletConnectQrModal } from '../../../left/wallet/hooks/useWalletConnectQrModal';
import walletLoggerService from '../../../common/helpers/walletLoggerService';
import OfferWrapper from '../../../left/wallet/OfferWrapper';
import AcceptTransactionDialog from '../../../common/AcceptTransactionDialog';
import { IHttpResponse } from '../../../../types/HeymateTypes/HttpResponse.model';

type TimeToStart = {
  days: number;
  hours: number;
  minutes: number;
};
type OwnProps = {
  props: IOffer;
};
type StateProps = {
  currentUser?: ApiUser;
  heymateUser?: IHeymateUser;
};
type DispatchProps = Pick<GlobalActions, 'showNotification' | 'sendDirectMessage' | 'openZoomDialogModal'>;

const Offer: FC<OwnProps & DispatchProps & StateProps> = ({
  props,
  currentUser,
  sendDirectMessage,
  openZoomDialogModal,
  showNotification,
  heymateUser,
}) => {
  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [zoomUser, setZoomUser] = useState<string>('Guest User');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [offerHour, setOfferHour] = useState('');
  const [offerStatus, setOfferStatus] = useState<ReservationStatus>(props.selectedSchedule?.status);
  const [timeToStart, setTimeToStart] = useState<TimeToStart>();
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [joinMeetingLoader, setJoinMeetingLoader] = useState(false);
  const [reJoinMeetingLoader, setReJoinMeetingLoader] = useState(false);
  const [participantsList, setParticipantsList] = useState<any>([]);
  const [openVideoDialog, setOpenVideoDialog] = useState(false);
  const [zoomStream, setZoomStream] = useState();
  const [zmClient, setZmClient] = useState<ClientType>();
  const [offerStarted, setOfferStarted] = useState(false);
  const [tagStatus, setTagStatus] = useState<{ text: string; color: any }>({
    text: '',
    color: 'green',
  });
  // celo action
  const [uri, setUri] = useState<string>('');
  const [openModal, setOpenModal] = useState(false);
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
  const handleCLoseWCModal = () => {
    setOpenModal(false);
    provider.isConnecting = false;
  };

  useWalletConnectQrModal(uri, openModal, handleCLoseWCModal);
  const handleOpenWCModal = async () => {
    if (uri === '') {
      await provider.enable();
    }
    setOpenModal(true);
    // renderUriAsQr();
  };
  provider.connector.on('display_uri', (err, payload) => {
    walletLoggerService({
      description: 'start connecting to wallet',
      status: 'Waiting',
    });
    const wcUri = payload.params[0];
    setUri(wcUri);
    setOpenModal(true);
    // renderUriAsQr(wcUri);
  });

  provider.onConnect(() => {
    walletLoggerService({
      description: 'finish connecting to wallet',
      status: 'Success',
    });
    setOpenModal(false);
    WalletConnectQRCodeModal.close();
  });

  const handleCancelByPush = async () => {
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/notification-services/offer/transaction`,
      method: 'POST',
      body: {
        action: 'CANCEL_BY_SERVICE_PROVIDER',
        timeSlotId: props.selectedSchedule?.id,
      },
    });
    console.log('===============Cancel By Service Provider Push Logs =======');
    console.log(response);
    return response;
  };

  const handleCancelInCelo = async (tradeId: string, consumerAddress: string, address: string) => {
    let kit: ContractKit;
    if (provider.isWalletConnect) {
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
        description: 'start accepting to cancel',
        status: 'Waiting',
      });
      const answer = await offerWrapper.cancelService(props, tradeId, false, consumerAddress);
      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      walletLoggerService({
        description: 'finish accepting to cancel',
        status: 'Success',
      });
      if (answer?.message?.startsWith('Error')) {
        showNotification({ message: answer.message });
        return;
      }
      if (answer) {
        // handleCancelReservation();
      } else {
        console.log('failed');
      }
    } else {
      handleOpenWCModal();
    }
  };
  /**
   * Get Ongoing Offer Time To Start
   */
  const getHowMuchDaysUnitllStar = (timestamp) => {
    let ts = timestamp;
    if (ts.length <= 10) {
      ts *= 1000;
    }
    const dateFuture = new Date(parseInt(ts || '', 10));
    const dateNow = new Date();
    // return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));

    let delta = Math.abs(dateFuture.getTime() - dateNow.getTime()) / 1000;

    // calculate (and subtract) whole days
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    return {
      days,
      hours,
      minutes,
    };
  };

  useEffect(() => {
    const loadParticipantsList = async (id: string) => {
      const list = await getParticipants(id);
      setParticipantsList(list);
    };
    if (props.selectedSchedule) {
      const hour = GenerateNewDate(props.selectedSchedule?.form_time);
      setOfferHour(hour.toLocaleTimeString());
      loadParticipantsList(props.selectedSchedule.id);
    }
    switch (props.selectedSchedule?.status) {
      case ReservationStatus.BOOKED:
        setTagStatus({
          color: 'green',
          text: 'Upcoming',
        });
        break;
      case ReservationStatus.MARKED_AS_FINISHED:
      case ReservationStatus.FINISHED:
        setTagStatus({
          color: 'gray',
          text: 'Finished',
        });
        break;
      case ReservationStatus.STARTED:
        setTagStatus({
          color: 'blue',
          text: 'In progress',
        });
        break;
      case ReservationStatus.MARKED_AS_STARTED:
        setTagStatus({
          color: 'blue',
          text: 'In progress',
        });
        break;
      case ReservationStatus.CANCELED_BY_SERVICE_PROVIDER:
        setTagStatus({
          color: 'red',
          text: 'Canceled',
        });
        break;
    }
    if (props?.selectedSchedule?.form_time) {
      const dateFuture = GenerateNewDate(props?.selectedSchedule?.form_time);
      const dateNow = new Date();
      if (dateFuture.getTime() > dateNow.getTime()) {
        const res: any = getHowMuchDaysUnitllStar(props.selectedSchedule.form_time);
        setTimeToStart(res);
      } else {
        setOfferStarted(true);
        setTimeToStart({ days: 0, minutes: 0, hours: 0 });
      }
    }
  }, [props.selectedSchedule, props.status]);

  useMemo(() => {
    if (currentUser) {
      let userData:any = {
        f: currentUser.firstName,
        i: currentUser.id,
      };
      userData = JSON.stringify(userData);
      userData = encode(userData);
      setZoomUser(userData);
    }
  }, [currentUser]);

  const handleHeaderMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const sendMessageToParticipants = async () => {
    const tsId = props?.selectedSchedule?.id;
    const participants = await getParticipants(tsId);
    if (participants) {
      for (const user of participants) {
        sendDirectMessage({
          chat: {
            id: user.telegramId,
          },
          // eslint-disable-next-line max-len
          text: `heymate reservation https://heymate.works/reservation/${user.reservationId}?dd`,
        });
      }
    } else {
      return false;
    }
  };

  const handleCloseVideoDialog = () => {
    setOpenVideoDialog(false);
  };

  const joinMeeting = async (meetingId: string, sessionPassword: string, isRejoin?: boolean) => {
    await sendMessageToParticipants();

    const client = new ZoomClient(meetingId, sessionPassword, zoomUser);

    if (isRejoin) {
      setReJoinMeetingLoader(true);
    } else {
      setJoinMeetingLoader(true);
    }

    await client.join();

    openZoomDialogModal({
      openModal: true,
      stream: client.mediaStream,
      zoomClient: client.zmClient,
      isLoading: joinMeetingLoader,
      reservationId: props?.selectedSchedule?.id,
      userType: 'SERVICE_PROVIDER',
    });

    setZmClient(client.zmClient);
    setZoomStream(client.mediaStream);

    if (isRejoin) {
      setReJoinMeetingLoader(false);
    } else {
      setJoinMeetingLoader(false);
    }
  };

  const simpleJoin = async () => {
    const client = new ZoomClient('test1', '123', zoomUser);

    await client.join();

    openZoomDialogModal({
      openModal: true,
      stream: client.mediaStream,
      zoomClient: client.zmClient,
      isLoading: false,
      reservationId: props?.selectedSchedule?.id,
      userType: 'SERVICE_PROVIDER',
    });
  };
  const reJoinMeeting = () => {
    if (props.selectedSchedule?.meetingId && props.selectedSchedule?.meetingPassword) {
      joinMeeting(props.selectedSchedule?.meetingId, props.selectedSchedule?.meetingPassword, true);
    }
  };

  const handleReservationStatusChanges = (newStatus: ReservationStatus) => {
    setOfferStatus(newStatus);
  };

  async function getParticipants(timeSlotId: any) {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/${timeSlotId}/offerParticipant`,
      method: 'GET',
      body: {},
    });
    if (response && response.status === 200) {
      return response.data.data;
    } else {
      return false;
    }
  }

  const handleCancelReservation = async () => {
    if (offerStatus === ReservationStatus.BOOKED) {
      const response = await axiosService({
        url: `${HEYMATE_URL}/time-table/${props.selectedSchedule?.id}`,
        method: 'PUT',
        body: {
          status: 'CANCELED_BY_SERVICE_PROVIDER',
        },
      });
      if (response?.status === 200) {
        setOfferStatus(ReservationStatus.CANCELED_BY_SERVICE_PROVIDER);
        const msg = 'Your offer has been cancelled !';
        showNotification({ message: msg });
      } else {
        showNotification({ message: response.data.message });
      }
    } else {
      const msg = `Sorry, we are not able to cancel as it on ${offerStatus} state!`;
      showNotification({ message: msg });
    }
  };

  const handleCancel = async () => {
    if (heymateUser?.paymentMethod === 'PUSH') {
      await handleCancelByPush();
    } else {
      let address: any = '';
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
        setOpenModal(false);
      });
      setLoadAcceptLoading(true);
      setOpenAcceptModal(true);
      let hasError = false;
      let count = 0;
      for (const item of participantsList) {
        count += 1;
        if (!hasError) {
          await handleCancelInCelo(item.tradeId, item.user_wallet_address, address).then(() => {
            showNotification({ message: `successfully cancel ${count} of ${participantsList.length}` });
          }, (err) => {
            setLoadAcceptLoading(false);
            setOpenAcceptModal(false);
            showNotification({ message: err.message });
            hasError = true;
          });
        }
      }
      // participantsList.forEach((item, index) => {
      //   if (!hasError) {
      //     handleCancelInCelo(item.tradeId, item.user_wallet_address, address).then((res) => {
      //       showNotification({ message: `successfully cancel ${index + 1} of ${participantsList.length}` });
      //     }, (err) => {
      //       setLoadAcceptLoading(false);
      //       setOpenAcceptModal(false);
      //       showNotification({ message: err.message });
      //       hasError = true;
      //     });
      //   }
      // });

      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      if (!hasError) {
        handleCancelReservation();
      }
    }
  };
  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setLoadAcceptLoading(false);
  };

  return (
    <div className="Offer-middle">
      <div className="offer-content">
        <div className="offer-body">
          <div className="meeting-left-side" onClick={() => setOpenDetailsModal(true)}>
            <div className="avatar-holder">
              { (props.media?.length > 0)
                ? (<img src={props.media[0]?.previewUrl} crossOrigin="anonymous" alt="" />)
                : (<img src={noOfferImg} alt="no-img" />)}
            </div>
            <div className="offer-details">
              <h4>{`${props.title} - ${offerHour}`}</h4>
              <span className="offer-location">{props.description}</span>
              <div className="offer-status">
                <TaggedText color={tagStatus.color}>
                  {tagStatus.text}
                </TaggedText>
              </div>
            </div>
          </div>
          <div className="meeting-right-side">
            <Button
              ref={menuButtonRef}
              className={isMenuOpen ? 'active' : ''}
              round
              ripple
              onClick={handleHeaderMenuOpen}
              size="smaller"
              color="translucent"
              ariaLabel="More actions"
            >
              <i className="icon-more" />
            </Button>
            <Menu
              className="offer-operation-menu"
              isOpen={isMenuOpen}
              positionX="right"
              positionY="top"
              autoClose
              onClose={handleClose}
            >
              <MenuItem icon="channel" onClick={() => setOpenDetailsModal(true)}>View Details</MenuItem>
              <MenuItem icon="channel" onClick={simpleJoin}>simple join</MenuItem>
              <MenuItem icon="user" onClick={handleCancel}>{lang('Cancel')}</MenuItem>
            </Menu>
          </div>
        </div>
        <OfferFooter
          offerType={props.meeting_type || 'DEFAULT'}
          fromTime={props.selectedSchedule?.form_time}
          toTime={props.selectedSchedule?.to_time}
          timeToStart={timeToStart}
          joinMeetingLoader={joinMeetingLoader}
          reJoinMeetingLoader={reJoinMeetingLoader}
          onReJoinMeeting={reJoinMeeting}
          status={offerStatus}
          onJoinMeeting={joinMeeting}
          onStatusChanged={handleReservationStatusChanges}
          timeSlotId={props?.selectedSchedule?.id || ''}
        />
      </div>
      <OfferDetailsDialog
        openModal={openDetailsModal}
        offer={props}
        onCloseModal={() => setOpenDetailsModal(false)}
      />
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
    const { currentUserId } = global;
    const { heymateUser } = global;
    return {
      currentUser: currentUserId ? selectUser(global, currentUserId) : undefined,
      heymateUser,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'openZoomDialogModal',
    'showNotification',
    'sendDirectMessage',
  ]),
)(Offer));
