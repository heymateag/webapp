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
import { ReservationStatus } from '../../../types/HeymateTypes/ReservationStatus';
import './HeyMateMessage.scss';
// eslint-disable-next-line import/extensions
import GenerateNewDate from '../helpers/generateDateBasedOnTimeStamp';
import { ZoomClient } from '../../main/components/ZoomSdkService/ZoomSdkService';
import { ClientType } from '../../main/components/ZoomSdkService/types';
import { withGlobal } from 'teact/teactn';
import { pick } from '../../../util/iteratees';
import { GlobalActions } from '../../../global/types';

type OwnProps = {
  message: ApiMessage;
};
type DispatchProps = Pick<GlobalActions, 'openZoomDialogModal'>;
interface IPurchasePlan {
  value: string;
  label: string;
  subLabel: string;
}
type PlanType = 'SINGLE' | 'BUNDLE' | 'SUBSCRIPTION';

const HeyMateMessage: FC<OwnProps & DispatchProps> = ({
  message,
  openZoomDialogModal,
}) => {
  /**
   * Get Heymate Offer
   * @param uuid
   */
  const [renderType, setRenderType] = useState<'OFFER' | 'RESERVATION'>('OFFER');
  const [offerMsg, setOfferMsg] = useState<IOffer>();
  const [offerLoaded, setOfferLoaded] = useState<boolean>(false);
  const [reservationLoaded, setReservationLoaded] = useState<boolean>(false);
  const [reservationId, setReservationId] = useState<string>('');
  const [purchasePlan, setPurchasePlan] = useState<IPurchasePlan[]>([]);
  const [zoomStream, setZoomStream] = useState();
  const [zmClient, setZmClient] = useState<ClientType>();
  const [joinMeetingLoader, setJoinMeetingLoader] = useState(false);
  const [openVideoDialog, setOpenVideoDialog] = useState(false);
  const [canJoin, setCanJoin] = useState(false);

  const [bundlePrice, setBundlePrice] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const [meetingData, setMeetingData] = useState<any>(undefined);

  const handleExpired = (expireTime: any) => {
    const now = new Date();
    const startTime = GenerateNewDate(expireTime);
    if (now.getTime() < startTime.getTime()) {
      setIsExpired(false);
    } else {
      setIsExpired(true);
    }
  };

  async function getOfferById(uuid) {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/${uuid}`,
      method: 'GET',
      body: {},
    });
    if (response && response.status === 200) {
      handleExpired(response.data.data.expiration);
      setOfferLoaded(true);
      setOfferMsg(response.data.data);
    } else {
      setOfferLoaded(false);
    }
  }

  const handleCloseVideoDialog = () => {
    setOpenVideoDialog(false);
  };

  /**
   * Get Reservation By Time Slot Id
   * @param tsId
   * @param userId
   */
  const getReservationByTimeSlotId = async (tsId: string, userId: string | null) => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/find-by-tsid?timeSlotId=${tsId}&consumerId=${userId}`,
      method: 'GET',
      body: {},
    });
    if ((response.data.data.length > 0) && response.status === 200) {
      const reservationData = response.data.data[0];

      if (reservationData.status === ReservationStatus.MARKED_AS_STARTED) {
        setCanJoin(true);
        setReservationId(reservationData.id);
        setReservationLoaded(true);
      } else {
        setCanJoin(false);
        setReservationLoaded(true);
      }
    } else {
      setReservationLoaded(false);
    }
  };

  const getReservationMeta = async (rsId: string) => {
    const response = await axiosService({
      url: `${HEYMATE_URL}/reservation/meta/${rsId}`,
      method: 'GET',
      body: {},
    });
    if (response.status) {
      const { data } = response;
      setMeetingData({
        title: data.offer.title,
        topic: data.meetingId,
        pass: data.meetingPassword,
        tsId: data.timeSlot.id,
        telegramId: data.user.telegramId,
        userName: data.user.fullName,
      });
    }
  };

  useEffect(() => {
    let offerId;
    if (message.content.text?.text.includes('heymate reservation')) {
      setRenderType('RESERVATION');
      const meetingDetails = message.content.text.text.split('/');
      const matches = message.content.text?.text.split(/reservation\/([a-f\d-]+)\?/);

      if (matches.length >= 2) {
        const reservationId = matches[1];
        getReservationMeta();
      } else {
        setReservationLoaded(false);
      }
      debugger;
      // setMeetingData({
      //   title: meetingDetails[1],
      //   topic: meetingDetails[2],
      //   pass: meetingDetails[3],
      //   tsId: meetingDetails[4],
      //   telegramId: meetingDetails[5],
      //   userName: meetingDetails[6],
      // });
    } else {
      const matches = message.content.text?.text.split(/offer\/([a-f\d-]+)\?/);
      if (matches && matches.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        offerId = matches[1];
        getOfferById(offerId);
      }
    }
  }, [message]);

  useEffect(() => {
    if (reservationId) {
      setReservationId(reservationId);
    }
  }, [reservationId]);

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
        // if (offerMsg.pricing.bundle) {
        //   let total = offerMsg.pricing.bundle.count * offerMsg.pricing.price;
        //   let discount = 0;
        //   if (offerMsg.pricing.bundle.discount_percent) {
        //     discount = (total * offerMsg.pricing.bundle.discount_percent) / 100;
        //   }
        //   total -= discount;
        //   setBundlePrice(total);
        //   temp.push({
        //     label: 'Bundle',
        //     value: 'bundle',
        //     subLabel: `${offerMsg.pricing.bundle.count} Sessions`,
        //   });
        // }
        // if (offerMsg.pricing.subscription) {
        //   temp.push({
        //     label: 'Subscription',
        //     value: 'subscription',
        //     subLabel: `${offerMsg.pricing.subscription.period}`,
        //   });
        // }
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

  const joinMeeting = async () => {
    const meetingId = meetingData.topic;
    const sessionPassword = meetingData.pass;

    const userData:any = {
      f: meetingData.userName,
      i: meetingData.telegramId,
    };
    const zoomUser = JSON.stringify(userData);

    const client = new ZoomClient(meetingId, sessionPassword, zoomUser);
    setJoinMeetingLoader(true);
    await client.join();

    openZoomDialogModal({
      openModal: true,
      stream: client.mediaStream,
      zoomClient: client.zmClient,
      isLoading: joinMeetingLoader,
      reservationId,
      userType: 'CONSUMER',
    });

    setZmClient(client.zmClient);
    setZoomStream(client.mediaStream);

    setJoinMeetingLoader(false);
  };

  // @ts-ignore
  return (
    <div>
      { (renderType === 'OFFER') && offerLoaded && (
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
                  {/* <span className="prices">{`${bundlePrice}  ${offerMsg?.pricing?.currency}`}</span> */}
                  {/* <span className="prices"> */}
                  {/*  {`${offerMsg?.pricing?.subscription?.subscription_price}  ${offerMsg?.pricing?.currency}`} */}
                  {/* </span> */}
                </div>
              </div>
              {/* <div className="refer-offer"> */}
              {/*  <div className="refer-offer-container"> */}
              {/*    <i className="hm-gift" /> */}
              {/*    <span>Refer this offer to and eran <i className="gift-price">$10</i></span> */}
              {/*    <i className="hm-arrow-right" /> */}
              {/*  </div> */}
              {/* </div> */}
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
            offer={offerMsg}
            openModal={openBookOfferModal}
            onCloseModal={handleCLoseBookOfferModal}
          />
          <OfferDetailsDialog
            onBookClicked={handleBookOfferClicked}
            message={message}
            openModal={openDetailsModal}
            offer={offerMsg}
            expired={isExpired}
            onCloseModal={handleCLoseDetailsModal}
          />
        </>
      )}
      {(renderType === 'OFFER') && !offerLoaded && (
        <div
          className="message-content text has-action-button
            is-forwarded has-shadow has-solid-background has-appendix"
        >
          <span className="normal-message">{message.content.text?.text}</span>
        </div>
      )}
      {
        (renderType === 'RESERVATION') && reservationLoaded && (
          <div className="HeyMateMessage">
            <div className="my-offer-body">
              <div className="my-offer-descs">
                <h4 className="title">Your Meeting :</h4>
                <span className="sub-title">{meetingData.title}</span>
                <p className="description">
                  has started, click join button to start !
                </p>
              </div>
            </div>
            <div className="my-offer-btn-group">
              <Button
                isLoading={joinMeetingLoader}
                disabled={!canJoin}
                onClick={joinMeeting}
                className="book-offer"
                size="smaller"
                color="primary"
              >
                <span>Join</span>
              </Button>
            </div>
          </div>
        )
      }
      {
        (renderType === 'RESERVATION') && !reservationLoaded && (
          <div
            className="message-content text has-action-button
              is-forwarded has-shadow has-solid-background has-appendix"
          >
            <span className="normal-message">{message.content.text?.text}</span>
          </div>
        )
      }
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  () => {
    return {
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'openZoomDialogModal',
  ]),
)(HeyMateMessage));
