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

import buildClassName from '../../util/buildClassName';
// @ts-ignore
import noOfferImg from '../../assets/heymate/no-offer-image.svg';

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

  const [showMore, setShowMore] = useState(false);

  const [bundlePrice, setBundlePrice] = useState(0);

  const [offerImage, setOfferImage] = useState('');

  const [stringRawDate, serStringRawData] = useState<StringRawData>({});

  const [stringCreatedRawDate, serStringCreatedRawData] = useState<StringRawData>({});

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
    if (offer?.createdAt) {
      let createdAt: any = offer?.createdAt;
      if (createdAt.toString().length <= 10) {
        createdAt = (parseInt(offer?.createdAt, 10) * 1000) || 0;
      }
      const rawDate = new Date(createdAt).toString().split(' ');
      serStringCreatedRawData({
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
            value: 'SINGLE',
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
        //     value: 'BUNDLE',
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
      isOpen={openModal}
      onClose={handleCLoseDetailsModal}
      onEnter={openModal ? handleCLoseDetailsModal : undefined}
      className="OfferModal"
    >
      <div className="offer-details-modal-container">
        <div className="offer-details-box">
          <div className="offer-images">
            {
              offerImage ? (
                <img src={offerImage} crossOrigin="anonymous" alt="" />
              ) : (
                <img src={noOfferImg} crossOrigin="anonymous" alt="" />
              )
            }
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
              <i className="expire-icon hm-calendar" />
              <span className="expire-text">Created</span>
            </div>
            <span className="expire-date">
              {`${stringCreatedRawDate?.dayOfWeek},
               ${stringCreatedRawDate?.month} ${stringCreatedRawDate?.dayOfMonth} ${stringCreatedRawDate?.year}`}
            </span>
          </div>
          <div className="offer-expiration">
            <div className="expire-icon-and-text">
              <i className="expire-icon hm-timer" />
              <span className="expire-text">Expiration</span>
            </div>
            <span className="expire-date">
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
              {/* <span className="prices">{`${bundlePrice}  ${offer?.pricing?.currency}`}</span> */}
              {/* <span className="prices"> */}
              {/*  {`${offer?.pricing?.subscription?.subscription_price}  ${offer?.pricing?.currency}`} */}
              {/* </span> */}
            </div>
          </div>
        </div>

        <div className="payment-terms offer-details-box">
          <span className="terms-caption">Payment Terms</span>
          <div className="terms-box">
            {offer?.payment_terms ? (
              <ul>
                <li>
                  <span className="term">
                    {`Delays in start by > ${offer?.payment_terms?.delay_in_start?.duration} min`}
                  </span>
                  <span className="rate">{offer?.payment_terms?.delay_in_start?.deposit}%</span>
                </li>
                <li>
                  <span className="term">
                    {`Cancellation in < ${offer?.payment_terms?.cancellation[0]?.range} hr of start`}
                  </span>
                  <span className="rate">{offer?.payment_terms?.cancellation[0]?.penalty}%</span>
                </li>
                <li>
                  <span className="term">
                    {`Cancellation in ${offer?.payment_terms?.cancellation[0]?.range}
                    - ${offer?.payment_terms?.cancellation[1]?.range} hr of start`}
                  </span>
                  <span className="rate">{offer?.payment_terms?.cancellation[1]?.penalty}%</span>
                </li>
                <li>
                  <span className="term">Initial deposit</span>
                  <span className="rate">{offer?.payment_terms?.deposit}%</span>
                </li>
              </ul>
            ) : (
              <div>No Terms available</div>
            )}
          </div>
        </div>

        <div className="payment-terms terms-cond offer-details-box">
          <span className="terms-caption">Terms and conditions</span>
          <p className={buildClassName('term-and-con-note', !showMore && 'clamp')}>
            {
              offer?.term_condition
            }
          </p>
        </div>
        <div onClick={() => setShowMore(!showMore)} className="offer-details-box show-more">
          See more
        </div>
        <div className="hidden-terms">
          <p>
            By buying this offer and continue the process,
            you are bound to the above Terms and you indicate your continued acceptance of these Terms and
            conditions.
          </p>
        </div>
        {onBookClicked && (
          <div className="btn-group offer-details-box">
            {/* {message && ( */}
            {/*  <Button className="see-details" size="smaller" color="secondary"> */}
            {/*    Promote */}
            {/*  </Button> */}
            {/* )} */}

            <Button
              onClick={() => onBookClicked(selectedPlan)}
              className="book-offer"
              size="smaller"
              disabled={expired}
              color="primary"
            >
              <span>Book Now</span>
            </Button>
          </div>
        )}
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
