import React, {
  FC, memo, useCallback, useEffect, useRef, useState, useMemo,
} from 'teact/teact';
import { withGlobal } from 'teact/teactn';
import Web3 from 'web3';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal';
import { pick } from '../../../util/iteratees';
import { IHeymateUser, ZoomDialogProps } from '../../../api/types';
import { GlobalActions } from '../../../global/types';

import Modal from '../../ui/Modal';
import buildClassName from '../../../util/buildClassName';
import Loading from '../../ui/Loading';
import Button from '../../ui/Button';

import Video from './components/Video';
import VideoSingle from './components/VideoSingle';
import { ReservationStatus } from '../../../types/HeymateTypes/ReservationStatus';
import { axiosService } from '../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../config';

import './ZoomDialog.scss';
import OfferWrapper from '../../left/wallet/OfferWrapper';

import AcceptTransactionDialog from '../../common/AcceptTransactionDialog';
import { useWalletConnectQrModal } from '../../left/wallet/hooks/useWalletConnectQrModal';
import walletLoggerService from '../../common/helpers/walletLoggerService';
import { IHttpResponse } from '../../../types/HeymateTypes/HttpResponse.model';

type StateProps = {
  zoomDialog: ZoomDialogProps;
  heymateUser?: IHeymateUser;
};
type DispatchProps = Pick<GlobalActions, 'closeZoomDialogModal' | 'showNotification'>;

const ZoomDialog : FC<DispatchProps & StateProps> = ({
  zoomDialog,
  closeZoomDialogModal,
  showNotification,
  heymateUser,
}) => {
  const [confirmModal, setConfirmModal] = useState(false);

  const [isMaximize, setIsMaximize] = useState(true);

  const [isMinimize, setIsMinimize] = useState(false);

  const [uri, setUri] = useState<string>('');
  // const [isConnected, setIsConnected] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [openModal, setOpenModal] = useState(false);
  // const [loadingQr, setLoadingQr] = useState(true);
  const [offer, setOffer] = useState<any>({});
  const [tradeId, setTradeId] = useState('');

  const [isVideoDecodeReady, setIsVideoDecodeReady] = useState(false);

  const [isSupportGalleryView, setIsSupportGalleryView] = useState<boolean>(
    true,
  );

  const [loadAcceptLoading, setLoadAcceptLoading] = useState(false);
  const [openAcceptModal, setOpenAcceptModal] = useState(false);

  useEffect(() => {
    // Update the document title using the browser API
    setTimeout(() => {
      setIsVideoDecodeReady(true);
    }, 500);
    return () => {
      setIsVideoDecodeReady(false);
    };
  }, [zoomDialog?.openModal]);

  useEffect(() => {
    setIsSupportGalleryView(zoomDialog.stream.isSupportMultipleVideos());
  }, [zoomDialog?.stream]);

  const handleCLoseDetailsModal = () => {
    closeZoomDialogModal({
      openModal: false,
    });
  };

  const handleFinishMeeting = async () => {
    let url;
    let status;
    if (zoomDialog.userType === 'CONSUMER') {
      url = `${HEYMATE_URL}/reservation/${zoomDialog.reservationId}`;
      status = ReservationStatus.FINISHED;
    } else {
      url = `${HEYMATE_URL}/time-table/${zoomDialog.reservationId}`;
      status = ReservationStatus.MARKED_AS_FINISHED;
    }
    const response = await axiosService({
      url,
      method: 'PUT',
      body: {
        status,
      },
    });
  };

  const getReservationById = useCallback(async () => {
    const url = `${HEYMATE_URL}/reservation/${zoomDialog.reservationId}`;
    const response = await axiosService({
      url,
      method: 'GET',
      body: {},
    });
    const { offerId } = response.data.data;
    setTradeId(response.data.data.tradeId);

    const offerUrl = `${HEYMATE_URL}/offer/${offerId}`;
    const offerItem = await axiosService({
      url: offerUrl,
      method: 'GET',
      body: {},
    });
    setOffer(offerItem.data.data);
  }, [zoomDialog.reservationId]);

  useEffect(() => {
    if (zoomDialog.userType === 'CONSUMER') {
      getReservationById();
    }
  }, [getReservationById, zoomDialog]);

  const provider = useMemo(() => {
    return new WalletConnectProvider({
      rpc: {
        44787: 'https://alfajores-forno.celo-testnet.org',
        42220: 'https://forno.celo.org',
      },
      qrcode: false,
      bridge: 'https://wc-bridge.heymate.works/',
      clientMeta: {
        description: 'Just a test description !',
        icons: [],
        url: 'www.ehsan.com',
        name: 'Heymate App',
      },
    });
  }, []);

  const handleCLoseWCModal = () => {
    setOpenModal(false);
    // setLoadingQr(true);
    provider.isConnecting = false;
  };

  useWalletConnectQrModal(uri, openModal, handleCLoseWCModal);
  /**
   * Get Account Data
   */
  provider.connector.on('display_uri', (err, payload) => {
    walletLoggerService({
      description: 'start connecting to wallet',
      status: 'Waiting',
    });
    const wcUri = payload.params[0];
    setUri(wcUri);
    setOpenModal(true);
    // renderUriAsQr(wcUri);
    // setLoadingQr(false);
  });

  provider.onConnect(() => {
    walletLoggerService({
      description: 'connected to wallet',
      status: 'Success',
    });
    setOpenModal(false);
    showNotification({ message: 'Successfully Connected to Wallet !' });
    WalletConnectQRCodeModal.close();
  });

  const handleFinishByPush = async () => {
    const response: IHttpResponse = await axiosService({
      url: `${HEYMATE_URL}/notification-services/offer/transaction`,
      method: 'POST',
      body: {
        action: 'FINISH',
        reservationId: zoomDialog.reservationId,
        tradeId,
      },
    });
    return response;
  };
  const handleFinishInCelo = async () => {
    if (zoomDialog.userType !== 'CONSUMER') {
      await handleFinishMeeting();
      return;
    }
    // If selected method is push
    if (heymateUser?.paymentMethod === 'PUSH') {
      await handleFinishByPush();
      return;
    }

    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
        // setIsConnected(true);
        setOpenModal(false);
      });
      // @ts-ignore
      const web3 = new Web3(provider);
      // @ts-ignoreffer
      kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      kit.defaultAccount = accounts[0];
      const mainNet = provider.chainId !== 44787;
      setLoadAcceptLoading(true);
      setOpenAcceptModal(true);
      walletLoggerService({
        description: 'start accepting to finish',
        status: 'Waiting',
      });
      const offerWrapper = new OfferWrapper(address, kit, mainNet, provider);
      const answer = await offerWrapper.finishService(offer, tradeId, address);
      setLoadAcceptLoading(false);
      setOpenAcceptModal(false);
      walletLoggerService({
        description: 'accepted finish',
        status: 'Success',
      });
      if (answer?.message?.startsWith('Error')) {
        showNotification({ message: answer.message });
        return;
      }
      if (answer) {
        handleFinishMeeting();
      } else {
        console.log('failed');
      }
    }
  };

  const dismissDialog = () => {
    setConfirmModal(false);
  };

  const handleOpenConfirmModal = () => {
    setConfirmModal(true);
  };

  const handleLeaveSessionClick = async () => {
    setConfirmModal(false);
    setIsVideoDecodeReady(false);
    try {
      await zoomDialog.zoomClient.leave();
      await handleFinishInCelo();
      closeZoomDialogModal({
        openModal: false,
      });
    } catch (e) {
      closeZoomDialogModal({
        openModal: false,
      });
      console.error('Error leaving session', e);
    }
  };

  const handleCloseZoomDialog = async () => {
    setConfirmModal(true);
  };

  const handleMaxDialog = () => {
    setIsMaximize(!isMaximize);
  };

  const handleMinDialog = () => {
    setIsMinimize(!isMinimize);
  };

  const ModalHeader = () => {
    return (
      <div className="custom-header">
        <div className="header-actions">
          <i onClick={handleCloseZoomDialog} className="hm-zoom-close" />
          <i onClick={handleMaxDialog} id="zoom-max" className="hm-zoom-maximize" />
          <i onClick={handleMinDialog} id="zoom-min" />
        </div>
      </div>
    );
  };

  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setLoadAcceptLoading(false);
  };

  return (
    <Modal
      header={ModalHeader()}
      hideBackDrop
      isOpen={zoomDialog.openModal}
      onClose={handleCLoseDetailsModal}
      onEnter={zoomDialog.openModal ? handleCLoseDetailsModal : undefined}
      className={
        buildClassName(
          'VideoSessionDialog video-session',
          isMaximize && 'maximize',
          isMinimize && 'minimize',
        )
      }
      title="Zoom Video"
    >
      {zoomDialog.isLoading && (
        <div className="wait-to-session-init">
          <Loading key="loading" />
        </div>
      )}
      <div className="viewport">
        {
          isSupportGalleryView ? (
            <Video
              isVideoReady={isVideoDecodeReady}
              onLeaveSessionClicked={handleOpenConfirmModal}
              zoomDialog={zoomDialog}
            />
          ) : (
            <VideoSingle
              isVideoReady={isVideoDecodeReady}
              onLeaveSessionClicked={handleOpenConfirmModal}
              zoomDialog={zoomDialog}
            />
          )
        }
      </div>
      <Modal
        isOpen={confirmModal}
        noBackdrop
        onClose={dismissDialog}
        className="error"
        title="End Session"
      >
        <p>Are you sure you want end to end this session ?</p>
        <div className="confirm-end-session">
          <Button isText className="confirm-dialog-button" onClick={handleLeaveSessionClick}>Yes</Button>
          <Button isText className="confirm-dialog-button" onClick={() => setConfirmModal(false)}>No</Button>
        </div>
      </Modal>
      {/* <QrCodeDialog */}
      {/*  uri={uri} */}
      {/*  openModal={openModal} */}
      {/*  onCloseModal={handleCLoseWCModal} */}
      {/*  loadingQr={loadingQr} */}
      {/*  qrCodeRef={qrCodeRef} */}
      {/* /> */}
      <AcceptTransactionDialog
        isOpen={openAcceptModal}
        onCloseModal={handleCloseAcceptModal}
        loadAcceptLoading={loadAcceptLoading}
      />
    </Modal>
  );
};

export default memo(withGlobal(
  (global): StateProps => pick(global, ['zoomDialog', 'heymateUser']),
  (setGlobal, actions): DispatchProps => pick(actions, ['closeZoomDialogModal', 'showNotification']),
)(ZoomDialog));
