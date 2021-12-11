import React, {
  FC, memo, useEffect, useState,
} from 'teact/teact';

import { ReservationStatus } from '../../../../../types/HeymateTypes/MyOrders.model';
import Button from '../../../../ui/Button';
import { axiosService } from '../../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../../config';

type TimeToStart = {
  days: number;
  hours: number;
  minutes: number;
};

type OwnProps = {
  timeToStart: TimeToStart;
  fromTime: string;
  toTime: string;
  status: ReservationStatus;
  onJoinMeeting: () => void;
  onStatusChanged: (status: ReservationStatus) => void;
  joinMeetingLoader: boolean;
  role?: 'CONSUMER' | 'SERVICE_PROVIDER';
  offerType: 'DEFAULT' | 'ONLINE';
  reservationId: string;
};

const OfferFooter: FC<OwnProps> = ({
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
}) => {
  const [reservationStatus, setReservationStatus] = useState(status);

  const [isLoading, setIsLoading] = useState(false);

  const [hasExpired, setHasExpired] = useState(false);

  const [canStart, setCanStart] = useState(false);

  const [canFinish, setCanFinish] = useState(false);

  useEffect(() => {
    const dateFutureFrom = new Date(fromTime);
    const dateFutureToTime = new Date(toTime);
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
    debugger
    if (offerType === 'ONLINE') {
      onJoinMeeting();
    }
  };

  return (
    <div className="offer-footer">
      <div className="date-time">
        {reservationStatus === ReservationStatus.BOOKED && (
          <div className={ReservationStatus.BOOKED}>
            <i className="hm-date-time" />
            <span>{`${timeToStart?.days} days `}</span>
            <span>{`${timeToStart?.hours}:${timeToStart?.minutes} to start`}</span>
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
            <span>{`${timeToStart.days}:${timeToStart.hours}:${timeToStart.minutes}`}</span>
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
          <div className="btn-finish">
            <Button
              isLoading={isLoading}
              onClick={() => handleChangeReservationStatus(ReservationStatus.FINISHED)}
              size="tiny"
              color="hm-primary-red"
              disabled={reservationStatus === ReservationStatus.STARTED}
            >
              Confirm End
            </Button>
          </div>
        )}
        { (reservationStatus === ReservationStatus.BOOKED
          || reservationStatus === ReservationStatus.MARKED_AS_STARTED) && (
          <div className="btn-confirm">
            <Button
              isLoading={isLoading}
              onClick={() => handleChangeReservationStatus(ReservationStatus.STARTED)}
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
    </div>
  );
};

export default memo(OfferFooter);
