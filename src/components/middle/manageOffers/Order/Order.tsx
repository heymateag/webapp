import { withGlobal } from 'teact/teactn';
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
import { GlobalActions } from '../../../../global/types';
import { IMyOrders } from '../../../../types/HeymateTypes/MyOrders.model';
import { ReservationStatus } from '../../../../types/HeymateTypes/ReservationStatus';
import './Order.scss';

// @ts-ignore
import offer1 from '../../../../assets/heymate/offer1.svg';
import TaggedText from '../../../ui/TaggedText';

import MenuItem from '../../../ui/MenuItem';
import Menu from '../../../ui/Menu';
import OfferDetailsDialog from '../../../common/OfferDetailsDialog';
import { HEYMATE_URL } from '../../../../config';
import { axiosService } from '../../../../api/services/axiosService';
import { ClientType } from '../../../main/components/ZoomSdkService/types';
import { ZoomClient } from '../../../main/components/ZoomSdkService/ZoomSdkService';
import OrderFooter from './components/OrderFooter';
import { pick } from '../../../../util/iteratees';
import GenerateNewDate from '../../helpers/generateDateBasedOnTimeStamp';
import { ApiUser } from '../../../../api/types';
import { selectUser } from '../../../../modules/selectors';

type TimeToStart = {
  days: number;
  hours: number;
  minutes: number;
};
type OwnProps = {
  props: IMyOrders;
  orderType?: 'DEFAULT' | 'ONLINE';
};
type StateProps = {
  currentUser?: ApiUser;
};
type DispatchProps = Pick<GlobalActions, 'showNotification' | 'openZoomDialogModal'>;

const Order: FC<OwnProps & DispatchProps & StateProps> = ({
  props,
  showNotification,
  orderType = 'DEFAULT',
  currentUser,
  openZoomDialogModal,
}) => {
  const lang = useLang();
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>(props.status);
  // eslint-disable-next-line no-null/no-null
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const [zoomUser, setZoomUser] = useState<string>('Guest User');

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [timeToStart, setTimeToStart] = useState<TimeToStart>();

  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  const [joinMeetingLoader, setJoinMeetingLoader] = useState(false);

  const [openVideoDialog, setOpenVideoDialog] = useState(false);

  const [meetingId, setMeetingId] = useState<string>(props.meetingId);

  const [meetingPassword, setMeetingPassword] = useState<string>(props.meetingPassword);

  const [zoomStream, setZoomStream] = useState();

  const [zmClient, setZmClient] = useState<ClientType>();

  const [tagStatus, setTagStatus] = useState<{ text: string; color: any }>({
    text: '',
    color: 'green',
  });
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
    switch (reservationStatus) {
      case ReservationStatus.BOOKED:
        setTagStatus({
          color: 'green',
          text: 'Upcoming',
        });
        break;
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
      case ReservationStatus.MARKED_AS_FINISHED:
        setTagStatus({
          color: 'yellow',
          text: 'Pending',
        });
        break;
      case ReservationStatus.CANCELED_BY_SERVICE_PROVIDER:
      case ReservationStatus.CANCELED_BY_CONSUMER:
        setTagStatus({
          color: 'red',
          text: 'Cancelled',
        });
        break;
    }
    if (props?.time_slot?.form_time) {
      const dateFuture = GenerateNewDate(props.time_slot.form_time);
      const dateNow = new Date();
      if (dateFuture.getTime() > dateNow.getTime()) {
        const res: any = getHowMuchDaysUnitllStar(props.time_slot.form_time);
        setTimeToStart(res);
      } else {
        // setOfferStarted(true);
        setTimeToStart({ days: 0, minutes: 0, hours: 0 });
      }
    }
  }, [reservationStatus, props?.time_slot?.form_time]);

  const handleHeaderMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const getOrderById = useCallback(async () => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/${props.id}`,
      method: 'GET',
      body: {},
    });
    if (response?.status && response?.data) {
      if (response.data.data.status !== reservationStatus) {
        setReservationStatus(response.data.data.status);
      }
      if (response.data.data.status === ReservationStatus.MARKED_AS_STARTED) {
        setMeetingPassword(response.data.data.meetingPassword);
        setMeetingId(response.data.data.meetingId);
      }
    }
  }, [props.id, reservationStatus]);

  useEffect(() => {
    let intervalId;
    if (reservationStatus !== ReservationStatus.FINISHED
      && reservationStatus !== ReservationStatus.MARKED_AS_STARTED
      && reservationStatus !== ReservationStatus.MARKED_AS_FINISHED) {
      intervalId = setInterval(() => {
        getOrderById();
      }, 5000);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [getOrderById, reservationStatus]);

  useMemo(() => {
    if (currentUser) {
      let userData:any = {
        f: currentUser.firstName,
        i: currentUser.id,
      };
      userData = JSON.stringify(userData);
      setZoomUser(userData);
    }
  }, [currentUser]);

  const handleCancelReservation = async () => {
    if (reservationStatus === ReservationStatus.BOOKED) {
      const response = await axiosService({
        url: `${HEYMATE_URL}/reservation/${props.id}`,
        method: 'PUT',
        body: {
          status: 'CANCELED',
        },
      });
      if (response?.status === 200) {
        setReservationStatus(ReservationStatus.CANCELED_BY_CONSUMER);
        const msg = 'Your order has been cancelled !';
        showNotification({ message: msg });
      }
    } else {
      const msg = `Sorry, we are not able to cancel as it on ${reservationStatus} state!`;
      showNotification({ message: msg });
    }
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const handleCloseVideoDialog = () => {
    setOpenVideoDialog(false);
  };

  const joinMeeting = async () => {
    const client = new ZoomClient(meetingId, meetingPassword, zoomUser);

    setJoinMeetingLoader(true);

    await client.join();

    openZoomDialogModal({
      openModal: true,
      stream: client.mediaStream,
      zoomClient: client.zmClient,
      isLoading: joinMeetingLoader,
      reservationId: props.id,
      userType: 'CONSUMER',
    });

    setZmClient(client.zmClient);
    setZoomStream(client.mediaStream);

    setJoinMeetingLoader(false);
  };

  const handleReservationStatusChanges = (newStatus: ReservationStatus) => {
    setReservationStatus(newStatus);
  };

  return (
    <div className="Offer-middle">
      <div className="offer-content">
        <div className="offer-body">
          <div className="meeting-left-side" onClick={() => setOpenDetailsModal(true)}>
            <div className="avatar-holder">
              <img src={offer1} alt="" />
            </div>
            <div className="offer-details">
              <h4>{props.offer.title}</h4>
              <span className="offer-location">{props.offer.description}</span>
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
              {/* <MenuItem icon="group">Re-Schedule</MenuItem> */}
              {props.status === ReservationStatus.BOOKED
               && (
                 <MenuItem icon="user" onClick={handleCancelReservation}>
                   {lang('Cancel')}
                 </MenuItem>
               )}
            </Menu>
          </div>
        </div>
        <OrderFooter
          offerType={orderType}
          reservationId={props.id}
          fromTime={props.time_slot?.form_time}
          toTime={props.time_slot?.to_time}
          timeToStart={timeToStart}
          joinMeetingLoader={joinMeetingLoader}
          status={reservationStatus}
          onJoinMeeting={joinMeeting}
          onStatusChanged={handleReservationStatusChanges}
          offer={props.offer}
          tradeId={props.tradeId || ''}
        />
      </div>
      <OfferDetailsDialog
        openModal={openDetailsModal}
        offer={props.offer}
        onCloseModal={() => setOpenDetailsModal(false)}
      />
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { currentUserId } = global;
    return {
      currentUser: currentUserId ? selectUser(global, currentUserId) : undefined,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'showNotification',
    'openZoomDialogModal',
  ]),
)(Order));
