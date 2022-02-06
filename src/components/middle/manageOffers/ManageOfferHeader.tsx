// eslint-disable-next-line import/no-unresolved
import React, { FC } from 'teact/teact';
import { GlobalActions, GlobalState } from 'src/global/types';
import { withGlobal } from 'teact/teactn';
import useLang from '../../../hooks/useLang';
import './ManageOffer.scss';
import Button from '../../ui/Button';
import { pick } from '../../../util/iteratees';

type StateProps = Pick<GlobalState, 'showHeymateManageOfferMiddle'>;
type DispatchProps = Pick<GlobalActions, 'setShowHeymateManageOfferMiddle'>;

const ManageOfferHeader: FC<StateProps & DispatchProps> = ({
  setShowHeymateManageOfferMiddle,
}) => {
  const lang = useLang();

  return (
    <div className="ManageOffer">
      <div className="left-header offer-header">
        <Button
          round
          size="smaller"
          color="translucent"
          onClick={() => setShowHeymateManageOfferMiddle({ showHeymateManageOfferMiddle: false })}
          ariaLabel="Return to chat list"
        >
          <i className="icon-arrow-left" />
        </Button>
        <h3>{lang('Manage Offer')}</h3>
      </div>
    </div>
  );
};

export default withGlobal<any>(
  (global): StateProps => pick(global, ['connectionState', 'showHeymateManageOfferMiddle']),
  (setGlobal, actions): DispatchProps => pick(actions, ['setShowHeymateManageOfferMiddle']),
)(ManageOfferHeader);
