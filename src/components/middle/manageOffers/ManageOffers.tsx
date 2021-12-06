// eslint-disable-next-line import/no-unresolved
import React, { FC } from 'teact/teact';

import useLang from '../../../hooks/useLang';
import './ManageOffers.scss';
import Transition from '../../ui/Transition';

import OnlineMetting from './OnlineMeeting/OnlineMetting';
import MyOrders from './MyOrders/MyOrders';
import MyOffers from './MyOffers/MyOffers';

export type OwnProps = {
  onReset: () => void;
  activeTab: number;
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
const ManageOffers: FC<OwnProps> = ({
  activeTab,
}) => {
  const lang = useLang();
  const tabs: IManageOfferTab[] = [
    { type: ManageOffer.MY_OFFERS, title: 'My Offers' },
    { type: ManageOffer.MY_ORDERS, title: 'My Orders' },
    { type: ManageOffer.MY_SUBSCRIPTIONS, title: 'Subscriptions' },
  ];
  // const [activeTab, setActiveTab] = useState<ManageOffer>(
  //   ManageOffer.MY_ORDERS,
  // );
  // const handleSwitchTab = useCallback((index: number) => {
  //   setActiveTab(index);
  // }, []);

  return (
    <div className="ManageOffers">
      <Transition
        className="full-content"
        name={lang.isRtl ? 'slide-reversed' : 'slide'}
        renderCount={tabs.length}
        activeKey={activeTab}
      >
        {() => {
          switch (activeTab) {
            case ManageOffer.MY_ORDERS:
              return <MyOffers />;
            case ManageOffer.MY_OFFERS:
              return <MyOrders />;
            case ManageOffer.MY_SUBSCRIPTIONS:
              return (
                <>
                  <span>
                    subscriptions
                  </span>
                  {/* <div className="offer-scroll custom-scroll">
                    <OnlineMetting />
                  </div> */}
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

// export default memo(
//   withGlobal(
//     (global): StateProps => pick(global, ['showHeymate']),
//     (setGlobal, actions): DispatchProps => pick(actions, ["setShowHeymate"])
//   )(ManageOffers),
// );
export default ManageOffers;
