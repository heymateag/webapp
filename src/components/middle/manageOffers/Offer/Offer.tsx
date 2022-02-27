/* eslint-disable max-len */
import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { encode } from 'js-base64';
import { withGlobal } from 'teact/teactn';
import RadioGroup from '../../../ui/RadioGroup';

import React, {
  FC,
  memo,
  useCallback, useMemo,
  useState,
 useEffect } from '../../../../lib/teact/teact';
import Button from '../../../ui/Button';

import './Offer.scss';
import OfferDetailsDialog from '../../../common/OfferDetailsDialog';
// @ts-ignore
import noOfferImg from '../../../../assets/heymate/no-offer-image.svg';

import ForwardPicker from '../../../main/ForwardPicker.async';

import { ApiUser } from '../../../../api/types';
import { GlobalActions } from '../../../../global/types';
import { selectUser } from '../../../../modules/selectors';
import { pick } from '../../../../util/iteratees';
import { HEYMATE_URL } from '../../../../config';

interface IPurchasePlan {
  value: string;
  label: string;
  subLabel: string;
}
type PlanType = 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';

type OwnProps = {
  props: IOffer;
};
type StateProps = {
  currentUser?: ApiUser;
};
type DispatchProps = Pick<GlobalActions, 'showNotification' | 'sendDirectMessage' | 'openZoomDialogModal'>;

const Offer: FC<OwnProps & DispatchProps & StateProps> = ({
  props,
  currentUser,
  sendDirectMessage,
}) => {
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [purchasePlan, setPurchasePlan] = useState<IPurchasePlan[]>([]);
  const [selectedReason, setSelectedReason] = useState('single');
  const handleSelectType = useCallback((value: string) => {
    setSelectedReason(value);
  }, []);
  const [isExpired, setIsExpired] = useState(false);
  const [planType, setPlanType] = useState<PlanType>('SINGLE');
  const [openBookOfferModal, setOpenBookOfferModal] = useState(false);
  const [isOpenForwardPicker, setIsOpenForwardPicker] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const txt = `Heymate Offer ${props?.title} ‌@Alimusavi67 will provide  ${props.category.main_cat} at ‌${props.pricing.price} ${props.pricing.currency} ‌Per Session. Address: ${props.location?.address} ‌${props.payment_terms.deposit}% is paid upfront. ‌${props.payment_terms.delay_in_start.deposit}% is returned if they delay more than ‌${props.payment_terms.delay_in_start.deposit} minutes. Learn more here: https://heymate.works/offer/${props.id}?d=eyJjIjoiSGFuZHltYW4gJiBSZXBhaXIiLCJlIjoiMTY0NDY4Mzg1MSJ9&l=en&p=b2ZmZXJfcGhyYXNl`;
    setMessage(txt);
  }, [props]);

  useMemo(() => {
    if (currentUser) {
      let userData:any = {
        f: currentUser.firstName,
        i: currentUser.id,
      };
      userData = JSON.stringify(userData);
      userData = encode(userData);
    }
  }, [currentUser]);

  const handleOpenDetailsModal = () => {
    setOpenDetailsModal(true);
  };

  const handleBookOfferClicked = (plan: PlanType) => {
    setPlanType(plan);
    setOpenDetailsModal(false);
    setOpenBookOfferModal(true);
  };

  const handleCLoseDetailsModal = () => {
    setOpenDetailsModal(false);
  };

  const shareOffer = async () => {
    setIsOpenForwardPicker(true);
    const shareData = {
      title: 'MDN',
      text: 'Learn web development on MDN!',
      url: 'https://developer.mozilla.org',
    }
    await navigator.share(shareData);
  };

  const setForwardChat = (userId: any) => {

    setIsOpenForwardPicker(false);
    sendDirectMessage({
      chat: {
        id: userId.id,
      },
      // eslint-disable-next-line max-len
      text: message,
    });
  };

  return (
    <div className="testtest">
      <div className="HeyMateMessage">
        <div className="my-offer-body">
          <div className="my-offer-img-holder">
            { (props?.media && props?.media[0]) ? (
              <img src={props?.media[0]?.previewUrl} crossOrigin="anonymous" alt="" />
            ) : (
              <img src={noOfferImg} alt="no-img" />
            )}
          </div>
          <div className="my-offer-descs">
            <h4 className="title">{props?.title}</h4>
            <span className="sub-title">{props?.category.main_cat}</span>
            <p className="description">
              {props?.description}
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
              <span className="prices active">{`${props?.pricing?.price} ${props?.pricing?.currency}`}</span>
            </div>
          </div>
        </div>
        <div className="my-offer-btn-group">
          <Button onClick={handleOpenDetailsModal} className="see-details" size="smaller" color="primary">
            See Details
          </Button>
          <Button
            onClick={shareOffer}
            className="book-offer"
            size="smaller"
            color="primary"
          >
            <span>Share</span>
          </Button>
        </div>
      </div>

      <OfferDetailsDialog
        // onBookClicked={handleBookOfferClicked}
        message={undefined}
        openModal={openDetailsModal}
        offer={props}
        expired={isExpired}
        onCloseModal={handleCLoseDetailsModal}
      />
      <ForwardPicker isOpen={isOpenForwardPicker} setForwardChatId={setForwardChat} />

    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { currentUserId } = global;
    return {
      currentUser: currentUserId ? selectUser(global, currentUserId) : undefined,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'openZoomDialogModal',
    'showNotification',
    'sendDirectMessage',
  ]),
)(Offer));
