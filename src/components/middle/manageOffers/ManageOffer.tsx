// eslint-disable-next-line import/no-unresolved
import React from 'teact/teact';

import './ManageOffer.scss';
import Offers from './Offers/Offers';

const ManageOffer = () => {
  return (
    <div className="ManageOffer">
      <Offers />
    </div>
  );
};

export default ManageOffer;
