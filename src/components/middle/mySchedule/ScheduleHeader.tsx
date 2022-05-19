// eslint-disable-next-line import/no-unresolved
import React, {
  FC, memo, useCallback, useState,
} from 'teact/teact';
import { GlobalActions, GlobalState } from 'src/global/types';
import { withGlobal } from 'teact/teactn';
import useLang from '../../../hooks/useLang';
import './MySchedule.scss';
import Button from '../../ui/Button';
import TabList from '../../ui/TabList';
import { pick } from '../../../util/iteratees';

type StateProps = Pick<GlobalState, 'showHeymateScheduleMiddle'>;
type DispatchProps = Pick<GlobalActions, 'setShowHeymateScheduleMiddle'>;

export type OwnProps = {
  onReset: () => void;
  activeTab?: number;
  handleSwitchTab: (index: number) => void;
};
enum ManageOffer {
  MY_ORDERS,
  MY_OFFERS,
  MY_SUBSCRIPTIONS,
}
interface IManageOfferTab {
  title: string;
  type: any;
}
const ScheduleHeader: FC<OwnProps & StateProps & DispatchProps> = ({
  onReset,
  handleSwitchTab,
  setShowHeymateScheduleMiddle,
  activeTab = 0,
}) => {
  const lang = useLang();
  const tabs: IManageOfferTab[] = [
    { type: ManageOffer.MY_OFFERS, title: 'My Offers' },
    { type: ManageOffer.MY_ORDERS, title: 'My Orders' },
    // { type: ManageOffer.MY_SUBSCRIPTIONS, title: 'Subscriptions' },
  ];
  const [currentActiveTab, setCurrentActiveTabb] = useState<ManageOffer>(
    activeTab,
  );
  const handleSwitchTab2 = useCallback((index: number) => {
    handleSwitchTab(index);
    setCurrentActiveTabb(index);
  }, []);

  return (
    <div className="MySchedule">
      <div className="left-header offer-header">
        <Button
          round
          size="smaller"
          color="translucent"
          onClick={() => setShowHeymateScheduleMiddle({ showHeymateScheduleMiddle: false })}
          ariaLabel="Return to chat list"
        >
          <i className="icon-arrow-left" />
        </Button>
        <h3>{lang('My Schedule')}</h3>
      </div>
      <div className="tab-wrapper">
        <TabList
          activeTab={currentActiveTab}
          tabs={tabs}
          onSwitchTab={handleSwitchTab2}
        />
      </div>

    </div>
  );
};

// export default memo(
//   withGlobal(
//   )(ScheduleHeader),
// );
export default withGlobal<OwnProps>(
  (global): StateProps => pick(global, ['connectionState', 'showHeymateScheduleMiddle']),
  (setGlobal, actions): DispatchProps => pick(actions, ['setShowHeymateScheduleMiddle']),
)(ScheduleHeader);
