import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { encode } from 'js-base64';
import { withGlobal } from 'teact/teactn';
import RadioGroup from '../../../ui/RadioGroup';
import BookOfferDialog from '../../../common/BookOfferDialog';

import React, {
  FC,
  memo,
  useCallback,
  useEffect, useMemo,
  useRef,
  useState,
} from '../../../../lib/teact/teact';
import useLang from '../../../../hooks/useLang';
import Button from '../../../ui/Button';

import { ReservationStatus } from '../../../../types/HeymateTypes/ReservationStatus';
import './Offer.scss';
import OfferDetailsDialog from '../../../common/OfferDetailsDialog';
// @ts-ignore
import noOfferImg from '../../../../assets/heymate/no-offer-image.svg';
import TaggedText from '../../../ui/TaggedText';

import MenuItem from '../../../ui/MenuItem';
import Menu from '../../../ui/Menu';

import { ApiUser } from '../../../../api/types';
import { GlobalActions } from '../../../../global/types';
import { selectUser } from '../../../../modules/selectors';
import { pick } from '../../../../util/iteratees';

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
}) => {
  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [offerHour, setOfferHour] = useState('');

  const [openDetailsModal, setOpenDetailsModal] = useState(false);


  const [tagStatus, setTagStatus] = useState<{ text: string; color: any }>({
    text: '',
    color: 'green',
  });

  const [purchasePlan, setPurchasePlan] = useState<IPurchasePlan[]>([]);
  const [selectedReason, setSelectedReason] = useState('single');
  const handleSelectType = useCallback((value: string) => {
    setSelectedReason(value);
  }, []);
  const [isExpired, setIsExpired] = useState(false);
  const [planType, setPlanType] = useState<PlanType>('SINGLE');
  const [openBookOfferModal, setOpenBookOfferModal] = useState(false);


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

  const handleHeaderMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const handleOpenDetailsModal = () => {
    setOpenDetailsModal(true);
  };
  const handleOpenBookOfferModal = () => {
    setOpenBookOfferModal(true);
  };
  // ============ Book Offer Modal
  const handleCLoseBookOfferModal = () => {
    setOpenBookOfferModal(false);
  };
  const handleBookOfferClicked = (plan: PlanType) => {
    setPlanType(plan);
    setOpenDetailsModal(false);
    setOpenBookOfferModal(true);
  };

  const handleCLoseDetailsModal = () => {
    setOpenDetailsModal(false);
  };

  return (
    // <div className="Offer-middle">
    //  asdasd
    //   <OfferDetailsDialog
    //     openModal={openDetailsModal}
    //     offer={props}
    //     onCloseModal={() => setOpenDetailsModal(false)}
    //   />
    // </div>
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
          <Button onClick={handleOpenDetailsModal} className="see-details" size="smaller" color="secondary">
            See Details
          </Button>
          <Button
            disabled={isExpired}
            onClick={handleOpenBookOfferModal}
            className="book-offer"
            size="smaller"
            color="primary"
          >
            <span>Book Now</span>
          </Button>
        </div>
      </div>
      <BookOfferDialog
        purchasePlanType={planType}
        offer={props}
        openModal={openBookOfferModal}
        onCloseModal={handleCLoseBookOfferModal}
      />
      <OfferDetailsDialog
        onBookClicked={handleBookOfferClicked}
        message={undefined}
        openModal={openDetailsModal}
        offer={props}
        expired={isExpired}
        onCloseModal={handleCLoseDetailsModal}
      />
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
