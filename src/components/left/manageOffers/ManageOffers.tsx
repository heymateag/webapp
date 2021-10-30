import React, {
  FC, memo, useCallback, useState,
} from 'teact/teact';

import useLang from '../../../hooks/useLang';
import './ManageOffers.scss';
import Button from '../../ui/Button';
import TabList from '../../ui/TabList';
import Transition from '../../ui/Transition';

import MyOrders from './MyOrders/MyOrders';

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
const ManageOffers: FC<OwnProps> = ({ onReset }) => {
  const lang = useLang();
  const tabs: IManageOfferTab[] = [
    { type: ManageOffer.MY_ORDERS, title: 'My Orders' },
    { type: ManageOffer.MY_OFFERS, title: 'My Offers' },
  ];
  const [activeTab, setActiveTab] = useState<ManageOffer>(ManageOffer.MY_ORDERS);
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
      <TabList activeTab={activeTab} tabs={tabs} onSwitchTab={handleSwitchTab} />
      <Transition
        className="full-content"
        name={lang.isRtl ? 'slide-reversed' : 'slide'}
        renderCount={tabs.length}
        activeKey={activeTab}
      >
        {() => {
          switch (activeTab) {
            case ManageOffer.MY_ORDERS:
              return (
                <MyOrders />
              );
            case ManageOffer.MY_OFFERS:
              return (
                <>
                  <span className="page-caption">On Going</span>
                  <div className="offer-scroll custom-scroll">
                    My Orders
                  </div>
                </>
              );
            default:
              return (
                <div>ehsan</div>
              );
          }
        }}
      </Transition>
    </div>
  );
};

export default memo(ManageOffers);
