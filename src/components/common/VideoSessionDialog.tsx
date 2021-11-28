import React, {
  FC, memo, useCallback, useEffect, useRef,
} from 'teact/teact';
import Modal from '../ui/Modal';
// @ts-ignore
import state from '../left/manageOffers/ZoomSdkService/js/meeting/session/simple-state';

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
  status: string;
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
  status,
}) => {
  // eslint-disable-next-line no-null/no-null
  const videoCanvas = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (openModal) {
      startVideo();
    }
  }, [openModal, startVideo, stopVideo]);
  return (
    <Modal
      hasCloseButton
      isOpen={openModal}
      onClose={handleCLoseDetailsModal}
      onEnter={openModal ? handleCLoseDetailsModal : undefined}
      className="VideoSessionDialog"
      title="Zoom Video"
    >
      <canvas ref={videoCanvas} width="640" height="360" />
    </Modal>
  );
};

export default memo(VideoSessionDialog);
