import React, {
  FC, memo, useCallback, useEffect, useRef, useState,
} from '../../../../lib/teact/teact';
import OfferFooter from './components/OfferFooter';
import OfferDetailsDialog from '../../../common/OfferDetailsDialog';
import useLang from '../../../../hooks/useLang';
import Button from '../../../ui/Button';
import { IMyOrders } from '../../../../types/HeymateTypes/MyOrders.model';
import { ReservationStatus } from '../../../../types/HeymateTypes/ReservationStatus';
import './Offer.scss';

// @ts-ignore
import offer1 from '../../../../assets/heymate/offer1.svg';
import TaggedText from '../../../ui/TaggedText';

import MenuItem from '../../../ui/MenuItem';
import Menu from '../../../ui/Menu';
import { axiosService } from '../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../config';
import { GlobalActions } from '../../../../global/types';
import { withGlobal } from 'teact/teactn';
import { pick } from '../../../../util/iteratees';

type TimeToStart = {
  days: number;
  hours: number;
  minutes: number;
};
type OwnProps = {
  props: IMyOrders;
  offerType?: 'DEFAULT' | 'ONLINE';
};

type DispatchProps = Pick<GlobalActions, 'showNotification'>;

const Offer: FC<OwnProps & DispatchProps> = ({
  props,
  offerType = 'DEFAULT',
  showNotification,
}) => {
  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>(props.status);
  const [joinMeetingLoader, setJoinMeetingLoader] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeToStart, setTimeToStart] = useState<TimeToStart>();
  const [offerStarted, setOfferStarted] = useState(false);
  const [tagStatus, setTagStatus] = useState<{ text: string; color: any }>({
    text: '',
    color: 'green',
  });

  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  /**
   * Get Ongoing Offer Time To Start
   */
  const getHowMuchDaysUnitllStar = (timestamp) => {
    let ts = timestamp;
    if (ts.length <= 10) {
      ts *= 1000;
    }
    const dateFuture = new Date(ts || '', 10);
    const dateNow = new Date();

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
      days, hours, minutes,
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
    if (props.time_slot?.form_time) {
      const dateFuture = new Date(parseInt(props.time_slot.form_time || '', 10));
      const dateNow = new Date();
      if (dateFuture.getTime() > dateNow.getTime()) {
        const res: any = getHowMuchDaysUnitllStar(props.time_slot.form_time);
        setTimeToStart(res);
      } else {
        setOfferStarted(true);
        setTimeToStart({ days: 0, minutes: 0, hours: 0 });
      }
    }
  }, [props.time_slot?.form_time, reservationStatus]);

  const handleHeaderMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const handleReservationStatusChanges = (newStatus: ReservationStatus) => {
    setReservationStatus(newStatus);
  };

  const joinMeeting = async () => {
    // TODO join meeting from states
  };

  const getOrderById = useCallback(async () => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/${props.id}`,
      method: 'GET',
      body: {},
    });
    if (response.status && response?.data) {
      if (response.data.data.status !== reservationStatus) {
        setReservationStatus(response.data.data.status);
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

  const handleCLoseDetailsModal = () => {
    setOpenDetailsModal(false);
  };

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

  return (
    <div className="Offer">
      <div className="offer-content">
        <div className="offer-body">
          <div className="meeting-left-side">
            <div className="avatar-holder">
              <img src={offer1} alt="" />
            </div>
            <div className="offer-details">
              <h4>{props.offer.title}</h4>
              <span className="offer-location">{props.offer.description}</span>
              <div className="offer-status">
                <TaggedText color={tagStatus.color}>{tagStatus.text}</TaggedText>
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
              <MenuItem onClick={() => setOpenDetailsModal(true)} icon="channel">View Details</MenuItem>
              {reservationStatus === ReservationStatus.BOOKED && (
                <MenuItem onClick={handleCancelReservation} icon="user">{lang('Cancel')}</MenuItem>
              )}
            </Menu>
          </div>
        </div>
        <OfferFooter
          offerType={offerType}
          reservationId={props.id}
          fromTime={props.time_slot?.form_time}
          toTime={props.time_slot?.to_time}
          timeToStart={timeToStart}
          joinMeetingLoader={joinMeetingLoader}
          status={reservationStatus}
          onJoinMeeting={joinMeeting}
          onStatusChanged={handleReservationStatusChanges}
        />
      </div>
      <OfferDetailsDialog
        openModal={openDetailsModal}
        offer={props.offer}
        onCloseModal={handleCLoseDetailsModal}
      />
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
)(Offer));
