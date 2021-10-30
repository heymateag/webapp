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
const HeyMateMessage: FC<OwnProps> = ({
  message,
}) => {
  /**
   * Get Heymate Offer
   * @param uuid
   */
  const [offerMsg, setOfferMsg] = useState<IOffer>();
  async function getOfferById(uuid) {
    const response = await axiosService({
      url: `${HEYMATE_URL}/offer/${uuid}`,
      method: 'GET',
      body: {},
    });
    setOfferMsg(response.data.data);
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
  // @ts-ignore
  return (
    <div>
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
                options={REPORT_OPTIONS}
                onChange={handleSelectType}
                selected={selectedReason}
              />
            </div>
            <div className="price-grp">
              <span className="prices active">$50</span>
              <span className="prices">$490</span>
              <span className="prices">$600</span>
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
        offer={offerMsg}
        openModal={openBookOfferModal}
        onCloseModal={handleCLoseBookOfferModal}
      />
      <OfferDetailsDialog
        message={message}
        openModal={openDetailsModal}
        offer={offerMsg}
        onCloseModal={handleCLoseDetailsModal}
      />
    </div>
  );
};

export default memo(HeyMateMessage);
