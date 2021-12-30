import React, {
  FC, memo, useEffect, useState,
} from 'teact/teact';

import { ReservationStatus } from '../../../../../types/HeymateTypes/ReservationStatus';
import Button from '../../../../ui/Button';
import { axiosService } from '../../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../../config';
import GenerateNewDate from '../../../helpers/generateDateBasedOnTimeStamp';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import Web3 from 'web3';
import OfferWrapper from '../../../../left/wallet/OfferWrapper';
import { IOffer } from 'src/types/HeymateTypes/Offer.model';

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

const OrderFooter: FC<OwnProps> = ({
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

  const handleStartInCelo = async () => {
    const provider = new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      qrcode: false,
    });
    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
      });
      // @ts-ignore
      const web3 = new Web3(provider);
      // @ts-ignoreffer
      kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      kit.defaultAccount = accounts[0];
      const offerWrapper = new OfferWrapper(address, kit, false, provider);
      const answer = await offerWrapper.startService(offer, tradeId, address);
      if (answer) {
        handleChangeReservationStatus(ReservationStatus.STARTED);
      }
    }
  };

  const handleFinishInCelo = async () => {
    const provider = new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      qrcode: false,
    });
    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
      });
      // @ts-ignore
      const web3 = new Web3(provider);
      // @ts-ignoreffer
      kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      kit.defaultAccount = accounts[0];
      const offerWrapper = new OfferWrapper(address, kit, false, provider);
      const answer = await offerWrapper.finishService(offer, tradeId, address);
      if (answer) {
        handleChangeReservationStatus(ReservationStatus.FINISHED);
      }
    }
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
          <div className="btn-finish">
            <Button
              isLoading={isLoading}
              onClick={() => handleFinishInCelo()}
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
    </div>
  );
};

export default memo(OrderFooter);
