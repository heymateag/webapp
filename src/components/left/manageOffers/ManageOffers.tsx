import React, {
  FC, memo, useCallback, useState,
} from 'teact/teact';
import { withGlobal } from 'teact/teactn';
import { GlobalActions, GlobalState } from 'src/global/types';

import useLang from '../../../hooks/useLang';
import './ManageOffers.scss';
import Button from '../../ui/Button';
import TabList from '../../ui/TabList';
import Transition from '../../ui/Transition';

import MyOrders from './MyOrders/MyOrders';
// import OnlineMetting from './OnlineMeeting/OnlineMetting';
import { pick } from '../../../util/iteratees';

type StateProps = Pick<GlobalState, 'showHeymate'>;
// @ts-ignore
type DispatchProps = Pick<GlobalActions, 'setShowHeymate'>;

export type OwnProps = {
  onReset: () => void;
};
enum ManageOffer {
  MY_ORDERS,
  MY_OFFERS,
}
interface IManageOfferTab {
  title: string;
  type: any;
}
const ManageOffers: FC<OwnProps & StateProps & DispatchProps> = ({
  onReset,
  setShowHeymate,
  showHeymate,
}) => {
  const lang = useLang();
  const tabs: IManageOfferTab[] = [
    { type: ManageOffer.MY_ORDERS, title: 'My Orders' },
    { type: ManageOffer.MY_OFFERS, title: 'My Offers' },
  ];
  const [activeTab, setActiveTab] = useState<ManageOffer>(
    ManageOffer.MY_ORDERS,
  );
  const handleSwitchTab = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

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
        <h3>{lang('ManageOffers')}</h3>
      </div>
      <TabList
        activeTab={activeTab}
        tabs={tabs}
        onSwitchTab={handleSwitchTab}
      />
      <Transition
        className="full-content"
        name={lang.isRtl ? 'slide-reversed' : 'slide'}
        renderCount={tabs.length}
        activeKey={activeTab}
      >
        {() => {
          switch (activeTab) {
            case ManageOffer.MY_ORDERS:
              return <MyOrders />;
            case ManageOffer.MY_OFFERS:
              return (
                <>
                  <span
                    className="page-caption"
                    onClick={() => setShowHeymate({ showHeymate: !showHeymate })}
                  >
                    On Going
                  </span>
                </>
              );
            default:
              return <div>ehsan</div>;
          }
        }}
      </Transition>
    </div>
  );
};

export default memo(
  withGlobal(
    (global): StateProps => pick(global, ['showHeymate']),
    (setGlobal, actions): DispatchProps => pick(actions, ['setShowHeymate']),
  )(ManageOffers),
);
