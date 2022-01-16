import { decode } from 'js-base64';
import React, {
  FC, memo, useCallback, useEffect, useRef, useState, useMemo
} from 'teact/teact';
import _ from 'lodash';
import { withGlobal } from 'teact/teactn';
import { pick } from '../../../util/iteratees';
import { ZoomDialogProps } from '../../../api/types';
import { GlobalActions } from '../../../global/types';

import Modal from '../../ui/Modal';
import buildClassName from '../../../util/buildClassName';
import ZoomVideoFooter from './components/ZoomVideoFooter';
import Loading from '../../ui/Loading';
import Button from '../../ui/Button';

import { useShare } from './hooks/useShare';
import { useGalleryLayout } from './hooks/useGalleryLayout';
import { usePagination } from './hooks/usePagination';
import { useCanvasDimension } from './hooks/useCanvasDimension';
import { useActiveVideo } from './hooks/useAvtiveVideo';
import { useSizeCallback } from '../../../hooks';
import { isShallowEqual } from './ZoomSdkService/utils/util';

import ZoomAvatar from './components/ZoomAvatar';
import { ReservationStatus } from '../../../types/HeymateTypes/ReservationStatus';
import { axiosService } from '../../../api/services/axiosService';
import { HEYMATE_URL } from '../../../config';

import Web3 from 'web3';
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import WalletConnectProvider from '@walletconnect/web3-provider';
import QrCreator from 'qr-creator';

import './ZoomDialog.scss';
import OfferWrapper from '../../left/wallet/OfferWrapper';
import Spinner from '../../ui/Spinner';

type StateProps = {
  zoomDialog: ZoomDialogProps;
};
type DispatchProps = Pick<GlobalActions, 'closeZoomDialogModal' | 'showNotification'>;

const ZoomDialog : FC<DispatchProps & StateProps> = ({
  zoomDialog,
  closeZoomDialogModal,
  showNotification,
}) => {
  // eslint-disable-next-line no-null/no-null
  const videoRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const shareRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const selfShareRef = useRef<HTMLCanvasElement & HTMLVideoElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const shareContainerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const shareContainerViewPortRef = useRef<HTMLDivElement | null>(null);

  const [confirmModal, setConfirmModal] = useState(false);

  const canvasDimension = useCanvasDimension(zoomDialog.stream, videoRef);

  const [isMaximize, setIsMaximize] = useState(true);

  const [isMinimize, setIsMinimize] = useState(false);

  const [isSharing, setIsSharing] = useState(false);

  const [uri, setUri] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [openModal, setOpenModal] = useState(false);
  const [loadingQr, setLoadingQr] = useState(true);
  const [offer, setOffer] = useState<any>({});
  const [tradeId, setTradeId] = useState('');

  const [containerDimension, setContainerDimension] = useState({
    width: 0,
    height: 0,
  });

  const [shareViewDimension, setShareViewDimension] = useState({
    width: 0,
    height: 0,
  });

  const { isRecieveSharing, isStartedShare, sharedContentDimension } = useShare(
    zoomDialog?.zoomClient,
    zoomDialog?.stream,
    shareRef,
  );

  const startAudioMuted = useCallback(async () => {
    await zoomDialog?.stream.startAudio();
    if (!zoomDialog?.stream.isAudioMuted()) {
      zoomDialog?.stream.muteAudio();
    }
  }, [zoomDialog?.stream]);

  useEffect(() => {
    startAudioMuted();
  }, [startAudioMuted, zoomDialog]);

  useEffect(() => {
    setIsSharing(isRecieveSharing || isStartedShare);
  }, [isRecieveSharing, isStartedShare]);

  useEffect(() => {
    if (isSharing && shareContainerRef.current) {
      const { width, height } = sharedContentDimension;
      const { width: containerWidth, height: containerHeight } = containerDimension;
      const ratio = Math.min(
        containerWidth / width,
        containerHeight / height,
        1,
      );
      setShareViewDimension({
        width: Math.floor(width * ratio),
        height: Math.floor(height * ratio),
      });
    }
  }, [isSharing, sharedContentDimension, containerDimension]);

  const onShareContainerResize = useCallback(({ width, height }) => {
    _.throttle(() => {
      setContainerDimension({ width, height });
    }, 50).call(this);
  }, []);

  useSizeCallback(shareContainerRef.current, onShareContainerResize);

  useEffect(() => {
    if (!isShallowEqual(shareViewDimension, sharedContentDimension)) {
      zoomDialog.stream?.updateSharingCanvasDimension(
        shareViewDimension.width,
        shareViewDimension.height,
      );
    }
  }, [zoomDialog.stream, sharedContentDimension, shareViewDimension]);

  useEffect(() => {
    if (shareContainerViewPortRef.current) {
      shareContainerViewPortRef.current.style.width = `${shareViewDimension.width}px`;
      shareContainerViewPortRef.current.style.height = `${shareViewDimension.height}px`;
    }
  }, [shareViewDimension.height, shareViewDimension.width, shareContainerViewPortRef]);

  const isSupportWebCodecs = () => {
    return typeof (window as any).MediaStreamTrackProcessor === 'function';
  };

  const activeVideo = useActiveVideo(zoomDialog.zoomClient);

  const {
    page, pageSize, totalPage, totalSize, setPage,
  } = usePagination(
    zoomDialog.zoomClient,
    canvasDimension,
  );

  const { visibleParticipants, layout: videoLayout } = useGalleryLayout(
    zoomDialog.zoomClient,
    zoomDialog.stream,
    true,
    videoRef,
    canvasDimension,
    {
      page,
      pageSize,
      totalPage,
      totalSize,
    },
  );

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
      clientMeta: {
        description: 'Just a test description !',
        icons: [],
        url: 'www.ehsan.com',
        name: 'Heymate App',
      },
    });
  }, []);

  const renderUriAsQr = (givenUri?) => {
    setOpenModal(true);
    setLoadingQr(true);

    setTimeout(() => {
      const validUri = givenUri || uri;
      const container = qrCodeRef.current!;
      container.innerHTML = '';
      container.classList.remove('pre-animate');

      QrCreator.render({
        text: `${validUri}`,
        radius: 0.5,
        ecLevel: 'M',
        fill: '#4E96D4',
        size: 280,
      }, container);
      setLoadingQr(false);
    }, 100);
  };
    /**
   * Get Account Data
   */
  provider.connector.on('display_uri', (err, payload) => {
    setIsConnected(false);
    const wcUri = payload.params[0];
    setUri(wcUri);
    renderUriAsQr(wcUri);
    setLoadingQr(false);
  });

  const handleFinishInCelo = async () => {
    if (zoomDialog.userType !== 'CONSUMER') {
      handleFinishMeeting();
      return;
    }
    let kit: ContractKit;
    let address: string = '';
    if (provider.isWalletConnect) {
      await provider.enable().then((res) => {
        // eslint-disable-next-line prefer-destructuring
        address = res[0];
        setIsConnected(true);
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
      const offerWrapper = new OfferWrapper(address, kit, mainNet, provider);
      const answer = await offerWrapper.finishService(offer, tradeId, address);
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

  const handleLeaveSessionClick = async () => {
    setConfirmModal(false);
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

  const handleCLoseWCModal = () => {
    setOpenModal(false);
    provider.isConnecting = false;
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
      <div
        className={buildClassName('share-container', isSharing && 'in-sharing')}
        ref={shareContainerRef}
      >
        <div
          className="share-container-viewport"
          ref={shareContainerViewPortRef}
        >
          <canvas
            className={buildClassName('share-canvas', 'other-share', isStartedShare && 'hidden')}
            ref={shareRef}
          />
          {isSupportWebCodecs() ? (
            <video
              className={buildClassName('share-canvas', isRecieveSharing && 'hidden')}
              ref={selfShareRef}
            />
          ) : (
            <canvas
              className={buildClassName('share-canvas', isRecieveSharing && 'hidden')}
              ref={selfShareRef}
            />
          )}
        </div>
      </div>
      <div
        className={buildClassName('video-container', isSharing && 'in-sharing')}
      >
        <canvas
          className="video-canvas"
          id="video-canvas"
          // width="500"
          // height="500"
          ref={videoRef}
        />
        <ul className="avatar-list">
          {visibleParticipants.map((user, index) => {
            if (index > videoLayout.length - 1) {
              return null;
            }
            const dimension = videoLayout[index];
            const {
              width, height, x, y,
            } = dimension;
            const { height: canvasHeight } = canvasDimension;
            const test = user.displayName;
            const userAllData = decode(user.displayName);
            const userId = JSON.parse(userAllData).i;
            return (
              <ZoomAvatar
                currentUserId={userId}
                participant={user}
                key={user.userId}
                isActive={activeVideo === user.userId}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  top: `${canvasHeight - y - height}px`,
                  left: `${x}px`,
                }}
              />
            );
          })}
        </ul>
      </div>
      <ZoomVideoFooter
        sharing={isStartedShare}
        shareRef={selfShareRef}
        zmClient={zoomDialog.zoomClient}
        mediaStream={zoomDialog.stream}
        initLeaveSessionClick={() => setConfirmModal(true)}
      />
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
      <Modal
        hasCloseButton
        isOpen={openModal}
        onClose={handleCLoseWCModal}
        onEnter={openModal ? handleCLoseWCModal : undefined}
        className="WalletQrModal"
        title="Wallet Connect"
      >
        {loadingQr && (
          <div className="spinner-holder">
            <Spinner color="blue" />
          </div>
        )}
        <div key="qr-container" className="qr-container pre-animate" ref={qrCodeRef} />
      </Modal>
    </Modal>
  );
};

export default memo(withGlobal(
  (global): StateProps => pick(global, ['zoomDialog']),
  (setGlobal, actions): DispatchProps => pick(actions, ['closeZoomDialogModal', 'showNotification']),
)(ZoomDialog));
