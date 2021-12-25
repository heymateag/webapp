import React, {
  FC, memo, useCallback, useState,
} from 'teact/teact';
import { MutableRefObject } from 'react';
import { MediaStream } from '../../ZoomSdkService/types';
import Button from '../../../../ui/Button';

type OwnProps = {
  initLeaveSessionClick: () => void;
  shareRef?: MutableRefObject<HTMLCanvasElement | null>;
  sharing?: boolean;
  mediaStream: MediaStream;
};

const ZoomVideoFooter : FC<OwnProps> = ({
  initLeaveSessionClick,
  shareRef,
  sharing,
  mediaStream,
}) => {
  const [isStartedScreenShare, setIsStartedScreenShare] = useState(false);

  const [isStartedAudio, setIsStartedAudio] = useState(false);

  const [isMuted, setIsMuted] = useState(true);

  const onScreenShareClick = useCallback(async () => {
    if (!isStartedScreenShare && shareRef && shareRef.current) {
      await mediaStream?.startShareScreen(shareRef.current);
      setIsStartedScreenShare(true);
    } else if (isStartedScreenShare) {
      await mediaStream?.stopShareScreen();
      setIsStartedScreenShare(false);
    }
  }, [mediaStream, isStartedScreenShare, shareRef]);

  const handleSoundClick = async () => {
    if (isStartedAudio) {
      if (isMuted) {
        console.log('voice started');
        await mediaStream?.unmuteAudio();
        setIsMuted(false);
      } else {
        console.log('voice muted');
        await mediaStream?.muteAudio();
        setIsMuted(true);
      }
    } else {
      await mediaStream?.startAudio();
      setIsStartedAudio(true);
    }
  };

  return (
    <div className="meeting-control-layer">
      <div className="meeting-option-buttons">
        <div className="btn-box" onClick={handleSoundClick}>
          <i id="zoom-mic" className="hm-zoom-mic" />
          <span>Mute</span>
        </div>
        <div className="btn-box">
          <i id="zoom-video" className="hm-zoom-video" />
          <span>Video</span>
        </div>
        <div className="btn-box" onClick={onScreenShareClick}>
          <i id="zoom-screen-share" className="hm-zoom-screenshare" />
          <span>Share Screen</span>
        </div>
      </div>
      <div className="leave-btn-holder">
        <Button onClick={initLeaveSessionClick} size="tiny" color="hm-primary-red">
          End
        </Button>
      </div>
    </div>
  );
};

export default memo(ZoomVideoFooter);
