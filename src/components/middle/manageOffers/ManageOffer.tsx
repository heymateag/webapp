// eslint-disable-next-line import/no-unresolved
import React from 'teact/teact';

import useLang from '../../../hooks/useLang';
import './ManageOffer.scss';



const ManageOffer = () => {
  const lang = useLang();


  return (
    <div className="ManageOffer">
      adadad
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
