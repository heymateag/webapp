import React, {
  FC, memo, useCallback, useMemo, useRef, useState,
} from 'teact/teact';
import VideoSDK from '@zoom/videosdk';
import Modal from '../../../ui/Modal';
import buildClassName from '../../../../util/buildClassName';
import ZoomVideoFooter from './components/ZoomVideoFooter';
import Loading from "../../../ui/Loading";

import { useShare } from './hooks/useShare';

import './VideoSessionDialog.scss';

type OwnProps = {
  openModal: boolean;
  onCloseModal: () => void;
  canvasWidth? : number;
  canvasHeight? : number;
  xOffset? : number;
  yOffset? : number;
  videoQuality? : number;
  stream: any;
  zoomClient: any;
  isLoading: boolean;
};

const VideoSessionDialog : FC<OwnProps> = ({
  openModal,
  onCloseModal,
  canvasWidth = 640,
  canvasHeight = 360,
  xOffset = 0,
  yOffset = 0,
  videoQuality = 2,
  stream,
  zoomClient,
  isLoading,
}) => {
  // eslint-disable-next-line no-null/no-null
  const videoRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const shareRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const selfShareRef = useRef<HTMLCanvasElement & HTMLVideoElement | null>(null);
  // eslint-disable-next-line no-null/no-null
  const shareContainerRef = useRef<HTMLDivElement | null>(null);

  const { isRecieveSharing, isStartedShare, sharedContentDimension } = useShare(
    zoomClient,
    stream,
    shareRef,
  );

  const isSharing = isRecieveSharing || isStartedShare;

  const contentDimension = sharedContentDimension;

  if (isSharing && shareContainerRef.current) {
    const { width, height } = sharedContentDimension;
    const {
      width: containerWidth,
      height: containerHeight,
    } = shareContainerRef.current.getBoundingClientRect();
    const ratio = Math.min(containerWidth / width, containerHeight / height, 1);
    contentDimension.width = Math.floor(width * ratio);
    contentDimension.height = Math.floor(height * ratio);
  }

  const videoCanvas = useRef<HTMLCanvasElement>(null);

  const [isMuted, setIsMuted] = useState(false);

  const [isButtonAlreadyClicked, setIsButtonAlreadyClicked] = useState(false);

  const [isPreviewAudioConnected, setIsPreviewAudioConnected] = useState(false);

  const [isMaximize, setIsMaximize] = useState(true);

  const [isMinimize, setIsMinimize] = useState(false);

  const isSupportWebCodecs = () => {
    return typeof (window as any).MediaStreamTrackProcessor === 'function';
  };

  const audioTrack = useMemo(() => {
    console.log('refresh');
    return VideoSDK.createLocalAudioTrack();
  }, []);

  const videoTrack = useMemo(() => {
    return VideoSDK.createLocalVideoTrack();
  }, []);

  const handleCLoseDetailsModal = () => {
    onCloseModal();
  };

  const startVideo = useCallback(async () => {
    const canvas = videoCanvas.current!;
    if (!stream.isCapturingVideo()) {
      try {
        // await stream.startVideo();
        const session = zoomClient.getSessionInfo();
        await stream.startVideo();
        await stream.renderVideo(
          canvas,
          session.userId,
          canvasWidth,
          canvasHeight,
          xOffset,
          yOffset,
          videoQuality,
        );
      } catch (error) {
        console.log(error);
      }
    }
  }, [canvasHeight, canvasWidth, stream, videoQuality, xOffset, yOffset, zoomClient]);

  const stopVideo = useCallback(async () => {
    const canvas = videoCanvas.current!;
    if (stream.isCapturingVideo()) {
      try {
        await stream.stopVideo();
        const session = zoomClient.getSessionInfo();
        stream.stopRenderVideo(canvas, session.userId);
      } catch (error) {
        console.log(error);
      }
    }
  }, [stream, zoomClient]);

  const toggleMuteUnmute = () => {
    if (isMuted) {
      audioTrack.mute();
    } else {
      audioTrack.unmute();
    }
  };

  const handleSoundClick = async () => {

  };

  const handleLeaveSessionClick = async () => {
    try {
      await zoomClient.leave();
      onCloseModal();
    } catch (e) {
      console.error('Error leaving session', e);
    }
  };

  const handleCloseZoomDialog = async () => {
    await handleLeaveSessionClick();
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
          <i onClick={handleMinDialog} id="zoom-min" className="hm-zoom-minimize" />
        </div>
      </div>
    );
  };

  return (
    <Modal
      header={ModalHeader()}
      isOpen={openModal}
      onClose={handleCLoseDetailsModal}
      onEnter={openModal ? handleCLoseDetailsModal : undefined}
      className={
        buildClassName(
          'VideoSessionDialog video-session',
          isMaximize && 'maximize',
          isMinimize && 'minimize',
        )
      }
      title="Zoom Video"
    >
      {isLoading && (
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
          // @ts-ignore
          style={`${contentDimension.width}px;${contentDimension.height}px`}
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
          width="800"
          height="350"
          ref={videoRef}
        />
      </div>
      <ZoomVideoFooter
        sharing
        shareRef={selfShareRef}
        mediaStream={stream}
        initLeaveSessionClick={handleLeaveSessionClick}
      />
    </Modal>
  );
};

export default memo(VideoSessionDialog);
