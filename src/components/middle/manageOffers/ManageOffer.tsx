// eslint-disable-next-line import/no-unresolved
import React from 'teact/teact';

import useLang from '../../../hooks/useLang';
import './ManageOffer.scss';
import Offers from './Offers/Offers';



const ManageOffer = () => {
  const lang = useLang();


  return (
    <div className="ManageOffer">
      <Offers />
    </div>
  );
};

// export default memo(
//   withGlobal(
//     (global): StateProps => pick(global, ['showHeymateScheduleMiddle']),
//     (setGlobal, actions): DispatchProps => pick(actions, ["setShowHeymateScheduleMiddle"])
//   )(ManageOffer),
// );
export default ManageOffer;
