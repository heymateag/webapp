import React, { FC } from 'teact/teact';
import { GlobalActions, GlobalState } from 'src/global/types';
import { withGlobal } from 'teact/teactn';
import useLang from '../../../hooks/useLang';
import './WalletMiddleHeader.scss';
import Button from '../../ui/Button';
import { pick } from '../../../util/iteratees';

type StateProps = Pick<GlobalState, 'showHeymateWalletMiddle'>;
type DispatchProps = Pick<GlobalActions, 'setShowHeymateWalletMiddle'>;

const ScheduleHeader: FC<StateProps & DispatchProps> = ({
  setShowHeymateWalletMiddle,
}) => {
  const lang = useLang();
  return (
    <div className="ManageOffers">
      <div className="left-header offer-header">
        <Button
          round
          size="smaller"
          color="translucent"
          onClick={() => setShowHeymateWalletMiddle({ showHeymateWalletMiddle: false })}
          ariaLabel="Return to chat list"
        >
          <i className="icon-arrow-left" />
        </Button>
        <h3>{lang('My Wallet')}</h3>
      </div>
    </div>
  );
};

export default withGlobal<any>(
  (global): StateProps => pick(global, ['connectionState', 'showHeymateWalletMiddle']),
  (setGlobal, actions): DispatchProps => pick(actions, ['setShowHeymateWalletMiddle']),
)(ScheduleHeader);
