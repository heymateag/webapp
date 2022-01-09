import React, {
  FC, memo, useCallback, useEffect, useState,
} from 'teact/teact';
import { withGlobal } from 'teact/teactn';
import { IOffer } from '../../types/HeymateTypes/Offer.model';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import './OfferDetailsDialog.scss';
import RadioGroup from '../ui/RadioGroup';
import { GlobalActions } from '../../global/types';
import { ApiMessage } from '../../api/types';
import { pick } from '../../util/iteratees';

type OwnProps = {
  offer: IOffer;
  openModal: boolean;
  onCloseModal: () => void;
  onBookClicked?: (planType: PlanType) => void;
  message?: ApiMessage;
  expired?: boolean;
};
interface IPurchasePlan {
  value: string;
  label: string;
  subLabel: string;
}
type StringRawData = {
  dayOfWeek?: string;
  month?: string;
  dayOfMonth?: string;
  year?: string;
};
type PlanType = 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';

type DispatchProps = Pick<GlobalActions, ('openForwardMenu')>;
const OfferDetailsDialog: FC<OwnProps & DispatchProps> = ({
  offer,
  openModal = false,
  openForwardMenu,
  onCloseModal,
  onBookClicked,
  message,
  expired = false,
}) => {
  const handleCLoseDetailsModal = () => {
    onCloseModal();
  };

  const [purchasePlan, setPurchasePlan] = useState<IPurchasePlan[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('SINGLE');

  const [bundlePrice, setBundlePrice] = useState(0);
  const [offerImage, setOfferImage] = useState('');

  const [stringRawDate, serStringRawData] = useState<StringRawData>({});

  const handleSelectType = useCallback((value: string) => {
    const val = value.toUpperCase();
    switch (val) {
      case 'SINGLE':
        setSelectedPlan('SINGLE');
        break;
      case 'BUNDLE':
        setSelectedPlan('SINGLE');
        break;
      case 'SUBSCRIPTION':
        setSelectedPlan('SUBSCRIPTION');
        break;
      default:
        setSelectedPlan('SINGLE');
    }
  }, []);

  const handleForward = useCallback(() => {
    openForwardMenu({ fromChatId: message?.chatId, messageIds: [message?.id] });
  }, [openForwardMenu, message]);

  useEffect(() => {
    if (offer) {
      if (offer.media) {
        if (offer.media[0]) {
          setOfferImage(offer.media[0]?.previewUrl);
        }
      }
    }
    if (offer?.expiration) {
      let expiration: any = offer?.expiration;
      if (expiration.toString().length <= 10) {
        expiration = (parseInt(offer?.expiration, 10) * 1000) || 0;
      }
      const rawDate = new Date(expiration).toString().split(' ');
      serStringRawData({
        dayOfWeek: rawDate[0],
        month: rawDate[1],
        dayOfMonth: rawDate[2],
        year: rawDate[3],
      });
    }
    if (offer && purchasePlan.length === 0) {
      const temp: IPurchasePlan[] = [];
      if (offer?.pricing?.bundle || offer?.pricing?.subscription) {
        if (offer.pricing) {
          temp.push({
            label: 'Single',
            value: 'single',
            subLabel: '1 Session',
          });
        }
        // if (offer.pricing.bundle) {
        //   let total = offer.pricing.bundle.count * offer.pricing.price;
        //   let discount = 0;
        //   if (offer.pricing.bundle.discount_percent) {
        //     discount = (total * offer.pricing.bundle.discount_percent) / 100;
        //   }
        //   total -= discount;
        //   setBundlePrice(total);
        //   temp.push({
        //     label: 'Bundle',
        //     value: 'bundle',
        //     subLabel: `${offer.pricing.bundle.count} Sessions`,
        //   });
        // }
        // if (offer.pricing.subscription) {
        //   temp.push({
        //     label: 'Subscription',
        //     value: 'subscription',
        //     subLabel: `${offer.pricing.subscription.period}`,
        //   });
        // }
        setPurchasePlan(temp);
      }
    }
  }, [purchasePlan, offer]);
  return (
    <Modal
      hasCloseButton
      isOpen={openModal}
      onClose={handleCLoseDetailsModal}
      onEnter={openModal ? handleCLoseDetailsModal : undefined}
      className="OfferModal"
      title="Offer Details"
    >
      <div className="offer-details-modal-container">
        <div className="offer-images">
          <img src={offerImage} crossOrigin="anonymous" alt="" />
          {message && (
            <div id="share-offer" onClick={handleForward}>
              <i className="hm-arrow-share" />
            </div>
          )}
        </div>
        <div className="title-and-sub">
          <span id="offer-title">{offer?.title}</span>
          <span id="offer-category">{offer?.category?.main_cat}</span>
        </div>
        <div className="offer-description">
          <p>{offer?.description}</p>
        </div>
        <div className="offer-expiration">
          <div className="expire-icon-and-text">
            <i id="expire-icon" className="hm-timer" />
            <span id="expire-text">Expiration</span>
          </div>
          <span id="expire-date">
            {`${stringRawDate?.dayOfWeek}, ${stringRawDate?.month} ${stringRawDate?.dayOfMonth} ${stringRawDate?.year}`}
          </span>
        </div>
        <div className="my-offer-types">
          <div className="radios-grp">
            <RadioGroup
              name="report-message"
              options={purchasePlan}
              onChange={handleSelectType}
              selected={selectedPlan}
            />
          </div>
          <div className="price-grp">
            <span className="prices active">{`${offer?.pricing?.price} ${offer?.pricing?.currency}`}</span>
            {/*<span className="prices">{`${bundlePrice}  ${offer?.pricing?.currency}`}</span>*/}
            {/* <span className="prices"> */}
            {/*  {`${offer?.pricing?.subscription?.subscription_price}  ${offer?.pricing?.currency}`} */}
            {/* </span> */}
          </div>
        </div>
        <div className="btn-group">
          {/* {message && ( */}
          {/*  <Button className="see-details" size="smaller" color="secondary"> */}
          {/*    Promote */}
          {/*  </Button> */}
          {/* )} */}
          {onBookClicked && (
            <Button
              onClick={() => onBookClicked(selectedPlan)}
              className="book-offer"
              size="smaller"
              disabled={expired}
              color="primary">
              <span>Book Now</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default memo(withGlobal<OwnProps>(
  (): any => {
    return {
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'openForwardMenu',
  ]),
)(OfferDetailsDialog));
