import React, { FC, memo } from '../../../../lib/teact/teact';
import useLang from '../../../../hooks/useLang';
import Button from '../../../ui/Button';


import './Offer.scss';

// @ts-ignore
import offer1 from '../../../../assets/heymate/offer1.svg';
// @ts-ignore
import datetime from '../../../../assets/heymate/date-time.svg';
// @ts-ignore
import play from '../../../../assets/heymate/play.svg';
// @ts-ignore
import time from '../../../../assets/heymate/time.svg';


const Offer: FC<{
  status?: 'UPCOMING' | 'WAITING_START' | 'CONFIRM_START' | 'IN_PROGRESS' | 'CONFIRMATION';
}> = ({
  status = 'CONFIRM_START',
}) => {
  const lang = useLang();

  return (
    <div className="Offer">
      <div className="offer-content">
        <div className="offer-body">
          <div className="avatar-holder">
            <img src={offer1} alt="" />
          </div>
          <div className="offer-details">
            <h4>Nail Implants</h4>
            <span className="offer-location">Beauty Salon</span>
            <div className="date-time">
              <div className="date-time">
                {status === 'UPCOMING' && (
                  <>
                    <img src={datetime} alt="" />
                    <span>2days</span>
                    <span>02:00:00</span>
                  </>
                )}
                {status === 'WAITING_START' && (
                  <>
                    <img src={time} alt="" />
                    <span>Waiting for your confirmation</span>
                  </>
                )}
                {status === 'CONFIRM_START' && (
                  <>
                    <img src={time} alt="" />
                    <span>Waiting for your confirmation</span>
                  </>
                )}
                {status === 'IN_PROGRESS' && (
                  <>
                    <img src={play} alt="" />
                    <span>In progress</span>
                    <span>01:20:35</span>
                  </>
                )}
                {status === 'CONFIRMATION' && (
                  <>
                    <img src={play} alt="" />
                    <span>Waiting for your confirmation</span>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
        <div className="offer-footer">
          <div className="btn-holder">
            { (status === 'UPCOMING' || status === 'WAITING_START' || status === 'CONFIRM_START') && (
              <div className="btn-cancel">
                <Button size="tiny" color="translucent">
                  cancel
                </Button>
              </div>
            )}
            { (status === 'IN_PROGRESS' || status === 'CONFIRMATION') && (
              <div className="btn-finish">
                <Button size="tiny" color="hm-primary-red" disabled={status === 'IN_PROGRESS'}>
                  Confirm End
                </Button>
              </div>
            )}
            { (status === 'WAITING_START' || status === 'CONFIRM_START') && (
              <div className="btn-confirm">
                <Button ripple size="tiny" color="primary" disabled={status === 'WAITING_START'}>
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

export default memo(Offer);
