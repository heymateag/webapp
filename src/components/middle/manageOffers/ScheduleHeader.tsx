// eslint-disable-next-line import/no-unresolved
import React, { FC, memo, useCallback, useState } from 'teact/teact';
import { GlobalActions, GlobalState } from 'src/global/types';
import { withGlobal } from 'teact/teactn';
import useLang from '../../../hooks/useLang';
import './ManageOffers.scss';
import Button from '../../ui/Button';
import TabList from '../../ui/TabList';
import { pick } from '../../../util/iteratees';

type StateProps = Pick<GlobalState, 'showHeymate'>;
type DispatchProps = Pick<GlobalActions, 'setShowHeymate'>;

export type OwnProps = {
  onReset: () => void;
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
}) => {
  const lang = useLang();
  const tabs: IManageOfferTab[] = [
    { type: ManageOffer.MY_OFFERS, title: 'My Offers' },
    { type: ManageOffer.MY_ORDERS, title: 'My Orders' },
    { type: ManageOffer.MY_SUBSCRIPTIONS, title: 'Subscriptions' },
  ];
  const [activeTab, setActiveTab] = useState<ManageOffer>(
    ManageOffer.MY_ORDERS,
  );
  const handleSwitchTab2 = useCallback((index: number) => {
    handleSwitchTab(index);
    setActiveTab(index);
  }, []);

  return (
    <div className="ManageOffers">
      <div className="left-header offer-header">
        <Button
          round
          size="smaller"
          color="translucent"
          onClick={onReset}
          ariaLabel="Return to chat list"
        >
          <i className="icon-arrow-left" />
        </Button>
        <h3>{lang('My Schedule')}</h3>
      </div>
      <TabList
        activeTab={activeTab}
        tabs={tabs}
        onSwitchTab={handleSwitchTab2}
      />

    </div>
  );
};

export default memo(
  withGlobal(
  )(ScheduleHeader),
);
