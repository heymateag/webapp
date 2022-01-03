import React, {
  FC, memo, useCallback, useState, useEffect,
} from 'teact/teact';
import { MutableRefObject } from 'react';
import { MediaStream, ClientType } from '../../ZoomSdkService/types';
import Button from '../../../../ui/Button';
import { MediaDevice } from '../../ZoomSdkService/video-types';
import { useUnmount } from '../../../../../hooks';
import buildClassName from '../../../../../util/buildClassName';

type OwnProps = {
  initLeaveSessionClick: () => void;
  shareRef?: MutableRefObject<HTMLCanvasElement | null>;
  sharing?: boolean;
  mediaStream: MediaStream;
  zmClient: ClientType;
};

const ZoomVideoFooter : FC<OwnProps> = ({
  initLeaveSessionClick,
  shareRef,
  sharing,
  mediaStream,
  zmClient,
}) => {
  const [isStartedScreenShare, setIsStartedScreenShare] = useState(false);

  const [isStartedAudio, setIsStartedAudio] = useState(false);

  const [isMuted, setIsMuted] = useState(true);

  const [isStartedVideo, setIsStartedVideo] = useState(false);

  const [activeMicrophone, setActiveMicrophone] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState('');
  const [activeCamera, setActiveCamera] = useState('');
  const [micList, setMicList] = useState<MediaDevice[]>([]);
  const [speakerList, setSpeakerList] = useState<MediaDevice[]>([]);
  const [cameraList, setCameraList] = useState<MediaDevice[]>([]);

  const onScreenShareClick = useCallback(async () => {
    if (!isStartedScreenShare && shareRef && shareRef.current) {
      await mediaStream?.startShareScreen(shareRef.current);
      setIsStartedScreenShare(true);
    } else if (isStartedScreenShare) {
      await mediaStream?.stopShareScreen();
      setIsStartedScreenShare(false);
    }
  }, [mediaStream, isStartedScreenShare, shareRef]);

  const onDeviceChange = useCallback(() => {
    if (mediaStream) {
      setMicList(mediaStream.getMicList());
      setSpeakerList(mediaStream.getSpeakerList());
      setCameraList(mediaStream.getCameraList());
      setActiveMicrophone(mediaStream.getActiveMicrophone());
      setActiveSpeaker(mediaStream.getActiveSpeaker());
      setActiveCamera(mediaStream.getActiveCamera());
    }
  }, [mediaStream]);

  useEffect(() => {
    // zmClient?.on('current-audio-change', onHostAudioMuted);
    // zmClient?.on('passively-stop-share', onPassivelyStopShare);
    zmClient?.on('device-change', onDeviceChange);
    return () => {
      // zmClient?.off('current-audio-change', onHostAudioMuted);
      // zmClient?.off('passively-stop-share', onPassivelyStopShare);
      zmClient?.off('device-change', onDeviceChange);
    };
  }, [zmClient, onDeviceChange]);

  useUnmount(() => {
    debugger;
    if (isStartedAudio) {
      mediaStream?.stopAudio();
    }
    if (isStartedVideo) {
      mediaStream?.stopVideo();
    }
    if (isStartedScreenShare) {
      mediaStream?.stopShareScreen();
    }
  });

  const onCameraClick = useCallback(async () => {
    if (isStartedVideo) {
      await mediaStream?.stopVideo();
      setIsStartedVideo(false);
    } else {
      await mediaStream?.startVideo();
      setIsStartedVideo(true);
    }
  }, [mediaStream, isStartedVideo]);

  const handleSoundClick = async () => {
    if (isStartedAudio) {
      if (isMuted) {
        try {
          await mediaStream?.unmuteAudio().then((res) => {
            debugger
            console.log(res);
          }).catch((e) => {
            debugger
            console.log(e.reason);
          });
        } catch (e) {
          debugger
        }

        setIsMuted(false);
      } else {
        await mediaStream?.muteAudio().then(res => {
          debugger
        }).catch(err => {
          debugger
        });
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
          <i
            className={buildClassName('hm-zoom-mic', !isMuted && 'active')}
            id="zoom-mic"
          />
          <span>Mute</span>
        </div>
        <div className="btn-box" onClick={onCameraClick}>
          <i
            id="zoom-video"
            className={buildClassName('hm-zoom-video', isStartedVideo && 'active')}
          />
          <span>Video</span>
        </div>
        <div className="btn-box" onClick={onScreenShareClick}>
          <i
            id="zoom-screen-share"
            className={buildClassName('hm-zoom-screenshare', sharing && 'active')}
          />
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
