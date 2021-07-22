// eslint-disable-next-line import/no-unresolved
import React, { FC, memo } from 'teact/teact';

import useLang from '../../../hooks/useLang';
import './ManageOffers.scss';
import Button from '../../ui/Button';

import Offer from './Offer/Offer';
import OnlineMetting from './OnlineMeeting/OnlineMetting';


export type OwnProps = {
  onReset: () => void;
};

const ManageOffers: FC<OwnProps> = ({ onReset }) => {
  const lang = useLang();

  return (
    <div className="ManageOffers">
      <div className="left-header">
        <Button
          round
          size="smaller"
          color="translucent"
          onClick={onReset}
          ariaLabel="Return to chat list"
        >
          <i className="icon-arrow-left" />
        </Button>
        <h3>{lang('MyOrders')}</h3>
      </div>
      <span className="page-caption">Upcoming</span>
      <div className="offer-scroll custom-scroll">
        <Offer />
        <OnlineMetting />
      </div>
    </div>
  );
};

export default memo(ManageOffers);
