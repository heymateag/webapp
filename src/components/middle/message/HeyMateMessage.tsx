import React, {
  FC, memo, useCallback, useEffect, useState,
} from '../../../lib/teact/teact';
import RadioGroup from '../../ui/RadioGroup';
import Button from '../../ui/Button';
import { ApiMessage } from '../../../api/types';
import { axiosService } from '../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../config';
import { IOffer } from '../../../types/HeymateTypes/Offer.model';
import OfferDetailsDialog from '../../common/OfferDetailsDialog';
import BookOfferDialog from '../../common/BookOfferDialog';
import './HeyMateMessage.scss';

type OwnProps = {
  message: ApiMessage;
};
interface IPurchasePlan {
  value: string;
  label: string;
  subLabel: string;
}
type PlanType = 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';

const HeyMateMessage: FC<OwnProps> = ({
  message,
}) => {
  /**
   * Get Heymate Offer
   * @param uuid
   */
  const [offerMsg, setOfferMsg] = useState<IOffer>();
  const [offerLoaded, setOfferLoaded] = useState<boolean>(false);

  const [purchasePlan, setPurchasePlan] = useState<IPurchasePlan[]>([]);

  const [bundlePrice, setBundlePrice] = useState(0);

  async function getOfferById(uuid) {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/${uuid}`,
      method: 'GET',
      body: {},
    });
    if (response && response.status === 200) {
      setOfferLoaded(true);
      setOfferMsg(response.data.data);
    } else {
      setOfferLoaded(false);
    }
  }
  useEffect(() => {
    let offerId;
    const matches = message.content.text?.text.split(/offer\/([a-f\d-]+)\?/);
    if (matches && matches.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      offerId = matches[1];
      getOfferById(offerId);
    }
  }, [message]);
  const REPORT_OPTIONS: { value: string; label: string; subLabel: string }[] = [
    { value: 'single', label: 'Single', subLabel: '1 Session - 2 Hour' },
    { value: 'bundle', label: 'Bundle', subLabel: '10 Sessions' },
    { value: 'subscription', label: 'Subscription', subLabel: '1 Month - Unlimited access' },
  ];
  const [selectedReason, setSelectedReason] = useState('single');
  const handleSelectType = useCallback((value: string) => {
    setSelectedReason(value);
  }, []);

  useEffect(() => {
    if (offerMsg && purchasePlan.length === 0) {
      const temp: IPurchasePlan[] = [];
      if (offerMsg?.pricing?.bundle || offerMsg?.pricing?.subscription) {
        if (offerMsg.pricing) {
          temp.push({
            label: 'Single',
            value: 'single',
            subLabel: '1 Session',
          });
        }
        if (offerMsg.pricing.bundle) {
          let total = offerMsg.pricing.bundle.count * offerMsg.pricing.price;
          let discount = 0;
          if (offerMsg.pricing.bundle.discount_percent) {
            discount = (total * offerMsg.pricing.bundle.discount_percent) / 100;
          }
          total -= discount;
          setBundlePrice(total);
          temp.push({
            label: 'Bundle',
            value: 'bundle',
            subLabel: `${offerMsg.pricing.bundle.count} Sessions`,
          });
        }
        if (offerMsg.pricing.subscription) {
          temp.push({
            label: 'Subscription',
            value: 'subscription',
            subLabel: `${offerMsg.pricing.subscription.period}`,
          });
        }
        setPurchasePlan(temp);
      }
    }
  }, [purchasePlan, offerMsg]);
  /**
   * Heymate Message Type
   */
  // ============== Offer Details Modal
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const handleCLoseDetailsModal = () => {
    setOpenDetailsModal(false);
  };
  const handleOpenDetailsModal = () => {
    setOpenDetailsModal(true);
  };
  // ============ Book Offer Modal
  const [openBookOfferModal, setOpenBookOfferModal] = useState(false);
  const handleCLoseBookOfferModal = () => {
    setOpenBookOfferModal(false);
  };
  const handleOpenBookOfferModal = () => {
    setOpenBookOfferModal(true);
  };

  const [planType, setPlanType] = useState<PlanType>('SINGLE');

  const handleBookOfferClicked = (plan: PlanType) => {
    setPlanType(plan);
    setOpenDetailsModal(false);
    setOpenBookOfferModal(true);
  };
  // @ts-ignore
  return (
    <div className="message-content-wrapper can-select-text">
      {
        offerLoaded ? (
          <>
            <div className="HeyMateMessage">
              <div className="my-offer-body">
                <div className="my-offer-img-holder">
                  <img src="https://picsum.photos/200/300" alt="" />
                </div>
                <div className="my-offer-descs">
                  <h4 className="title">{offerMsg?.title}</h4>
                  <span className="sub-title">{offerMsg?.category.main_cat}</span>
                  <p className="description">
                    {offerMsg?.description}
                  </p>
                </div>
                <div className="my-offer-types">
                  <div className="radios-grp">
                    <RadioGroup
                      name="report-message"
                      options={purchasePlan}
                      onChange={handleSelectType}
                      selected={selectedReason}
                    />
                  </div>
                  <div className="price-grp">
                    <span className="prices active">{`${offerMsg?.pricing?.price} ${offerMsg?.pricing?.currency}`}</span>
                    <span className="prices">{`${bundlePrice}  ${offerMsg?.pricing?.currency}`}</span>
                    <span className="prices">
                      {`${offerMsg?.pricing?.subscription?.subscription_price}  ${offerMsg?.pricing?.currency}`}
                    </span>
                  </div>
                </div>
                <div className="refer-offer">
                  <div className="refer-offer-container">
                    <i className="hm-gift" />
                    <span>Refer this offer to and eran <i className="gift-price">$10</i></span>
                    <i className="hm-arrow-right" />
                  </div>
                </div>
              </div>
              <div className="my-offer-btn-group">
                <Button onClick={handleOpenDetailsModal} className="see-details" size="smaller" color="secondary">
                  See Details
                </Button>
                <Button onClick={handleOpenBookOfferModal} className="book-offer" size="smaller" color="primary">
                  <span>Book Now</span>
                </Button>
              </div>
            </div>
            <BookOfferDialog
              purchasePlanType={planType}
              offer={offerMsg}
              openModal={openBookOfferModal}
              onCloseModal={handleCLoseBookOfferModal}
            />
            <OfferDetailsDialog
              onBookClicked={handleBookOfferClicked}
              message={message}
              openModal={openDetailsModal}
              offer={offerMsg}
              onCloseModal={handleCLoseDetailsModal}
            />
          </>
        ) : (
          <div className="message-content text has-action-button is-forwarded has-shadow has-solid-background has-appendix">
            <span className="normal-message">{message.content.text?.text}</span>
          </div>
        )
      }
    </div>
  );
};

export default memo(HeyMateMessage);
