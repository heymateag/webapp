import React, {
  FC, memo, useCallback, useEffect, useMemo, useRef, useState,
} from 'teact/teact';
import VideoSDK from '@zoom/videosdk';
// eslint-disable-next-line import/no-duplicates
// @ts-ignore
import micIcon from '../../assets/microphone.svg';
// @ts-ignore
import videoIcon from '../../assets/video.svg';
// @ts-ignore
import screenshare from '../../assets/screenshare.svg';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
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

  const [isMuted, setIsMuted] = useState(false);

  const [isButtonAlreadyClicked, setIsButtonAlreadyClicked] = useState(false);

  const [isPreviewAudioConnected, setIsPreviewAudioConnected] = useState(false);

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

  const onSoundClick = async (event) => {
    event.preventDefault();

    if (!isButtonAlreadyClicked) {
      // Blocks logic from executing again if already in progress
      setIsButtonAlreadyClicked(true);

      try {
        if (!isPreviewAudioConnected) {
          await audioTrack.start();
          setIsPreviewAudioConnected(true);
        }
        setIsMuted(!isMuted);
        await toggleMuteUnmute();
      } catch (e) {
        console.error('Error toggling mute', e);
      }

      setIsButtonAlreadyClicked(false);
    } else {
      console.log('=== WARNING: already toggling mic ===');
    }
  };

  const initLeaveSessionClick = async () => {
    try {
      await zoomClient.leave();
      onCloseModal();
    } catch (e) {
      console.error('Error leaving session', e);
    }
  };

  return (
    <Modal
      hasCloseButton
      isOpen={openModal}
      onClose={handleCLoseDetailsModal}
      onEnter={openModal ? handleCLoseDetailsModal : undefined}
      className="VideoSessionDialog video-session"
      title="Zoom Video"
    >
      <canvas ref={videoCanvas} width="640" height="360" />
      <div className="meeting-control-layer">
        <div className="meeting-option-buttons">
          <div className="btn-box" onClick={onSoundClick}>
            <img src={micIcon} alt="" />
            <span>Mute</span>
          </div>
          <div className="btn-box">
            <img src={screenshare} alt="" />
            <span>Video</span>
          </div>
          <div className="btn-box">
            <img src={videoIcon} alt="" />
            <span>Share Screen</span>
          </div>
        </div>
        <div className="leave-btn-holder">
          <Button onClick={initLeaveSessionClick} size="tiny" color="hm-primary-red">
            End
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default memo(VideoSessionDialog);
