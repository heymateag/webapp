import React, {
  FC, memo, useEffect, useRef, useState,
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
import buildClassName from '../../../../util/buildClassName';

const OnlineMeeting: FC<{
  status?: 'UPCOMING' | 'WAITING_START' | 'CONFIRM_START' | 'IN_PROGRESS' | 'CONFIRMATION' | 'FINISHED';
}> = ({
  status = 'FINISHED',
}) => {
  const [tagStatus, setTagStatus] = useState<{text: string; color: any}>({
    text: '',
    color: 'green',
  });
  useEffect(() => {
    switch (status) {
      case 'UPCOMING':
        setTagStatus({
          color: 'green',
          text: 'Upcoming',
        });
        break;
      case 'FINISHED':
        setTagStatus({
          color: 'gray',
          text: 'Finished',
        });
        break;
      case 'IN_PROGRESS':
        setTagStatus({
          color: 'blue',
          text: 'In progress',
        });
        break;
      case 'WAITING_START':
      case 'CONFIRM_START':
      case 'CONFIRMATION':
        setTagStatus({
          color: 'yellow',
          text: 'Pending',
        });
        break;
    }
  }, [status]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="OnlineMeeting">
      <div className="offer-content">
        <div className="offer-body">
          <div className="meeting-left-side">
            <div className="avatar-holder">
              <img src={offer1} alt="" />
            </div>
            <div className="offer-details">
              <h4>{tagStatus.text}</h4>
              <span className="offer-location">English Class - Single</span>
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
              size="smaller"
              color="translucent"
              ariaLabel="More actions"
            >
              <i className="icon-more" />
            </Button>
          </div>
        </div>
        <div className="offer-footer">
          <div className="btn-holder">

            { status === 'UPCOMING' && (
              <div className="status-bar">
                <div className={buildClassName('status-info', status.toLowerCase())}>
                  <i className="hm-date-time" />
                  <span>02:25:16 to start</span>
                </div>
                <div className="btn-finish">
                  <Button size="tiny" color="primary" disabled>
                    Confirm
                  </Button>
                </div>
              </div>
            )}
            { (status === 'WAITING_START' || status === 'CONFIRM_START') && (
              <div className="status-bar">
                <div className={buildClassName('status-info', status.toLowerCase())}>
                  <i className="hm-time" />
                  {status === 'WAITING_START' && (
                    <span>Waiting for service provider to start</span>
                  )}
                  {status === 'CONFIRM_START' && (
                    <span>Waiting for you to confirm</span>
                  )}
                </div>
                <div className="btn-finish">
                  <Button size="tiny" color="primary" disabled={status === 'WAITING_START'}>
                    Confirm
                  </Button>
                </div>
              </div>
            )}
            { (status === 'IN_PROGRESS' || status === 'CONFIRMATION') && (
              <div className="status-bar">
                <div className={buildClassName('status-info', status.toLowerCase())}>

                  {status === 'IN_PROGRESS' && (
                    <>
                      <i className="hm-play" />
                      <span>01:30:00 remains</span>
                    </>
                  )}
                  {status === 'CONFIRMATION' && (
                    <>
                      <i className="hm-time" />
                      <span>Waiting for you to confirm</span>
                    </>
                  )}
                </div>
                <div className="btn-finish">
                  <Button size="tiny" color="hm-primary-red" disabled={status === 'IN_PROGRESS'}>
                    Confirm End
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OnlineMeeting);
