import React, {
  FC, memo, useEffect, useState,
} from 'teact/teact';

import { ReservationStatus } from '../../../../../types/HeymateTypes/ReservationStatus';
import Button from '../../../../ui/Button';
import { axiosService } from '../../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../../config';
import '../Offer.scss';
import GenerateNewDate from '../../../helpers/generateDateBasedOnTimeStamp';

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
  onJoinMeeting: (meetingId: string, sessionPassword: string) => void;
  onStatusChanged: (status: ReservationStatus) => void;
  joinMeetingLoader: boolean;
  role?: 'CONSUMER' | 'SERVICE_PROVIDER';
  offerType: 'DEFAULT' | 'ONLINE';
  timeSlotId: string;
};

const OfferFooter: FC<OwnProps> = ({
  timeToStart,
  fromTime,
  toTime,
  status,
  onJoinMeeting,
  joinMeetingLoader,
  role = 'SERVICE_PROVIDER',
  onStatusChanged,
  offerType,
  timeSlotId,
}) => {
  const [reservationStatus, setReservationStatus] = useState(status);

  const [isLoading, setIsLoading] = useState(false);

  const [hasExpired, setHasExpired] = useState(false);

  const [canStart, setCanStart] = useState(false);

  const [canFinish, setCanFinish] = useState(false);

  useEffect(() => {
    if (fromTime && toTime) {
      const dateFutureFrom = GenerateNewDate(fromTime);
      const dateFutureToTime = GenerateNewDate(toTime);
      const dateNow = new Date();
      if ((dateFutureFrom.getTime() < dateNow.getTime())) {
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

  // eslint-disable-next-line max-len
  const handleChangeReservationStatus = async (newStatus: ReservationStatus, meetingId?: string, sessionPassword?: string) => {
    setIsLoading(true);
    const response = await axiosService({
      url: `${HEYMATE_URL}/time-table/${timeSlotId}`,
      method: 'PUT',
      body: {
        status: newStatus,
        sessionPassword,
        meetingId,
      },
    });
    setIsLoading(false);
    if (response?.status === 200) {
      setReservationStatus(newStatus);
      onStatusChanged(newStatus);
    }
  };

  const makeRandomString = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const handleStart = () => {
    const meetingId = makeRandomString(10);
    const sessionPassword = makeRandomString(10);
    handleChangeReservationStatus(ReservationStatus.MARKED_AS_STARTED, meetingId, sessionPassword);
    onJoinMeeting(meetingId, sessionPassword);
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
            <span>In Progress</span>
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
            {/* <span>Waiting for your confirm</span> */}
            <span>Finished</span>
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
        { (role === 'SERVICE_PROVIDER' && reservationStatus === ReservationStatus.BOOKED)
        && (
          <div className="btn-cancel">
            <Button
              disabled={!canStart}
              isLoading={joinMeetingLoader}
              onClick={handleStart}
              size="tiny"
              color="primary"
            >
              {offerType === 'DEFAULT' ? 'Start' : 'Start Meeting'}
            </Button>
          </div>
        )}
        { (role === 'SERVICE_PROVIDER' && reservationStatus === ReservationStatus.MARKED_AS_STARTED)
        && (
          <div className="btn-cancel">
            <Button
              // disabled={!canFinish}
              isLoading={joinMeetingLoader}
              onClick={() => handleChangeReservationStatus(ReservationStatus.MARKED_AS_FINISHED)}
              size="tiny"
              color="primary"
            >
              Finish
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
              Finish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(OfferFooter);
