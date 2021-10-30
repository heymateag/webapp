// eslint-disable-next-line import/no-unresolved
import React, { FC, memo, useCallback, useEffect, useState } from "teact/teact";
import { GlobalActions, GlobalState } from "src/global/types";

import useLang from "../../../hooks/useLang";
import "./ManageOffers.scss";
import Button from "../../ui/Button";
import TabList from "../../ui/TabList";
import Transition from "../../ui/Transition";

import Offer from "./Offer/Offer";
import OnlineMetting from "./OnlineMeeting/OnlineMetting";
import MyOrders from "./MyOrders/MyOrders";
import { axiosService } from "../../../api/services/axiosService";
import { HEYMATE_URL } from "../../../config";
import { withGlobal } from "../../../lib/teact/teactn";
import { pick } from "../../../util/iteratees";

type StateProps = Pick<GlobalState, "showHeymate">;
type DispatchProps = Pick<GlobalActions, "setShowHeymate">;

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
const ManageOffers: FC<OwnProps & StateProps & DispatchProps> = ({
  onReset,
  setShowHeymate,
  showHeymate,
  activeTab
}) => {
  const lang = useLang();
  const tabs: IManageOfferTab[] = [
    { type: ManageOffer.MY_OFFERS, title: "My Offers" },
    { type: ManageOffer.MY_ORDERS, title: "My Orders" },
    { type: ManageOffer.MY_SUBSCRIPTIONS, title: "Subscriptions" },
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
        name={lang.isRtl ? "slide-reversed" : "slide"}
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
                    onClick={() =>
                      setShowHeymate({ showHeymate: !showHeymate })
                    }
                  >
                    On Going
                  </span>
                  <div className="offer-scroll custom-scroll">
                    <OnlineMetting />
                  </div>
                </>
              );
            case ManageOffer.MY_SUBSCRIPTIONS:
              return (
                <>
                  <span
                    className="page-caption"
                    onClick={() =>
                      setShowHeymate({ showHeymate: !showHeymate })
                    }
                  >
                    subscriptions
                  </span>
                  <div className="offer-scroll custom-scroll">
                    <OnlineMetting />
                  </div>
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
    (global): StateProps => pick(global, ["showHeymate"]),
    (setGlobal, actions): DispatchProps => pick(actions, ["setShowHeymate"])
  )(ManageOffers)
);
