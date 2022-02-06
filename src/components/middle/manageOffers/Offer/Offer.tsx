import { IOffer } from 'src/types/HeymateTypes/Offer.model';
import { encode } from 'js-base64';
import { withGlobal } from 'teact/teactn';
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

import GenerateNewDate from '../../helpers/generateDateBasedOnTimeStamp';
import { ApiUser } from '../../../../api/types';
import { GlobalActions } from '../../../../global/types';
import { selectUser } from '../../../../modules/selectors';
import { pick } from '../../../../util/iteratees';
import { axiosService } from '../../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../../config';
import Avatar from '../../../common/Avatar';

type TimeToStart = {
  days: number;
  hours: number;
  minutes: number;
};
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
  /**
   * Get Ongoing Offer Time To Start
   */
  const getHowMuchDaysUnitllStar = (timestamp) => {
    let ts = timestamp;
    if (ts.length <= 10) {
      ts *= 1000;
    }
    const dateFuture = new Date(parseInt(ts || '', 10));
    const dateNow = new Date();
    // return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));

    let delta = Math.abs(dateFuture.getTime() - dateNow.getTime()) / 1000;

    // calculate (and subtract) whole days
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    return {
      days,
      hours,
      minutes,
    };
  };

  useEffect(() => {
    if (props.selectedSchedule) {
      const hour = GenerateNewDate(props.selectedSchedule?.form_time);
      setOfferHour(hour.toLocaleTimeString());
    }
    switch (props.selectedSchedule?.status) {
      case ReservationStatus.BOOKED:
        setTagStatus({
          color: 'green',
          text: 'Upcoming',
        });
        break;
      case ReservationStatus.MARKED_AS_FINISHED:
      case ReservationStatus.FINISHED:
        setTagStatus({
          color: 'gray',
          text: 'Finished',
        });
        break;
      case ReservationStatus.STARTED:
        setTagStatus({
          color: 'blue',
          text: 'In progress',
        });
        break;
      case ReservationStatus.MARKED_AS_STARTED:
        setTagStatus({
          color: 'blue',
          text: 'In progress',
        });
        break;
      case ReservationStatus.CANCELED_BY_SERVICE_PROVIDER:
        setTagStatus({
          color: 'yellow',
          text: 'Pending',
        });
        break;
    }
    if (props?.selectedSchedule?.form_time) {
      const dateFuture = GenerateNewDate(props?.selectedSchedule?.form_time);
      const dateNow = new Date();
      if (dateFuture.getTime() > dateNow.getTime()) {
        const res: any = getHowMuchDaysUnitllStar(props.selectedSchedule.form_time);
      } else {

      }
    }
  }, [props.selectedSchedule, props.status]);

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


  return (
    <div className="Offer-middle">
      <div className="offer-content">
        <div className="offer-body">
          <div className="meeting-left-side" onClick={() => setOpenDetailsModal(true)}>
            <div className="avatar-holder">
              { (props.media?.length > 0)
                ? (<img src={props.media[0]?.previewUrl} crossOrigin="anonymous" alt="" />)
                : (<img src={noOfferImg} alt="no-img" />)}
            </div>
            <div className="offer-details">
              <h4>{`${props.title} - ${offerHour}`}</h4>
              <span className="offer-location">{props.description}</span>
              <div className="offer-status">
                <TaggedText color={tagStatus.color}>
                  {tagStatus.text}
                </TaggedText>
              </div>
            </div>
          </div>
          <div className="meeting-right-side">
            <Button
              ref={menuButtonRef}
              className={isMenuOpen ? 'active' : ''}
              round
              ripple
              onClick={handleHeaderMenuOpen}
              size="smaller"
              color="translucent"
              ariaLabel="More actions"
            >
              <i className="icon-more" />
            </Button>
            <Menu
              className="offer-operation-menu"
              isOpen={isMenuOpen}
              positionX="right"
              positionY="top"
              autoClose
              onClose={handleClose}
            >
              <MenuItem icon="channel" onClick={() => setOpenDetailsModal(true)}>View Details</MenuItem>
              {/*<MenuItem icon="channel" onClick={simpleJoin}>simple join</MenuItem>*/}
              <MenuItem icon="user">{lang('Cancel')}</MenuItem>
            </Menu>
          </div>
        </div>
      </div>
      <OfferDetailsDialog
        openModal={openDetailsModal}
        offer={props}
        onCloseModal={() => setOpenDetailsModal(false)}
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
