import React, {
  FC, memo, useCallback, useEffect, useRef, useState,
} from '../../../../lib/teact/teact';
import Button from '../../../ui/Button';
import TaggedText from '../../../ui/TaggedText';
// @ts-ignore
import offer1 from '../../../../assets/heymate/offer1.svg';
// @ts-ignore
import datetime from '../../../../assets/heymate/date-time.svg';
// @ts-ignore
import time from '../../../../assets/heymate/time.svg';
// @ts-ignore
import play from '../../../../assets/heymate/play.svg';
import './OnlineMeeting.scss';
import { IMyOrders, ReservationStatus } from '../../../../types/HeymateTypes/MyOrders.model';
import Menu from '../../../ui/Menu';
import MenuItem from '../../../ui/MenuItem';
import useLang from '../../../../hooks/useLang';

type OwnProps = {
  props: IMyOrders;
};

const OnlineMeeting: FC<OwnProps> = ({
  props,
}) => {
  const [tagStatus, setTagStatus] = useState<{ text: string; color: any }>({
    text: '',
    color: 'green',
  });
  const lang = useLang();
  useEffect(() => {
    switch (props.status) {
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
      case ReservationStatus.CANCELED_BY_SERVICE_PROVIDER:
        setTagStatus({
          color: 'yellow',
          text: 'Pending',
        });
        break;
    }
  }, [props.status, props.time_slot.form_time]);
  // eslint-disable-next-line no-null/no-null
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleHeaderMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleClose = () => {
    setIsMenuOpen(false);
  };
  return (
    <div className="OnlineMeeting">
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
              <MenuItem icon="channel">View Details</MenuItem>
              <MenuItem icon="group">Re-Schedule</MenuItem>
              <MenuItem icon="user">{lang('Cancel')}</MenuItem>
            </Menu>
          </div>
        </div>
        <div className="offer-footer">
          <div className="date-time">
            {props.status === ReservationStatus.BOOKED && (
              <div className={ReservationStatus.BOOKED}>
                <i className="hm-date-time" />
                <span>2days</span>
                <span>02:00:00</span>
              </div>
            )}
            {props.status === ReservationStatus.MARKED_AS_STARTED && (
              <div className={ReservationStatus.MARKED_AS_STARTED}>
                <img src={time} alt="" />
                <span>Waiting for your confirmation</span>
              </div>
            )}
            {props.status === ReservationStatus.FINISHED && (
              <div className={ReservationStatus.FINISHED}>
                <img src={time} alt="" />
                <span>Waiting for your confirmation</span>
              </div>
            )}
            {props.status === ReservationStatus.STARTED && (
              <div className={ReservationStatus.STARTED}>
                <img src={play} alt="" />
                <span>In progress</span>
                <span>01:20:35</span>
              </div>
            )}
            {props.status === ReservationStatus.CANCELED_BY_SERVICE_PROVIDER && (
              <div className={ReservationStatus.CANCELED_BY_SERVICE_PROVIDER}>
                <img src={play} alt="" />
                <span>Waiting for your Cancel confirmation</span>
              </div>
            )}
          </div>
          <div className="btn-holder">
            { (props.status === ReservationStatus.BOOKED
              || props.status === ReservationStatus.MARKED_AS_STARTED) && (
              <div className="btn-cancel">
                <Button size="tiny" color="translucent" disabled={props.status === ReservationStatus.BOOKED}>
                  Join
                </Button>
              </div>
            )}
            { (props.status === ReservationStatus.FINISHED
              || props.status === ReservationStatus.STARTED) && (
              <div className="btn-finish">
                <Button size="tiny" color="hm-primary-red" disabled={props.status === ReservationStatus.STARTED}>
                  Confirm End
                </Button>
              </div>
            )}
            { (props.status === ReservationStatus.MARKED_AS_STARTED
              || props.status === ReservationStatus.STARTED) && (
              <div className="btn-confirm">
                <Button ripple size="tiny" color="primary" disabled={props.status === ReservationStatus.STARTED}>
                  Confirm Start
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OnlineMeeting);
