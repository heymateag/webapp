import React, {
  FC, memo, useCallback, useEffect, useRef, useState,
} from 'teact/teact';
import { decode } from 'js-base64';
import { throttle } from 'lodash';

import buildClassName from '../../../../util/buildClassName';
import ZoomAvatar from './ZoomAvatar';
import { useCanvasDimension } from '../hooks/useCanvasDimension';
import { useShare } from '../hooks/useShare';
import { useSizeCallback } from '../../../../hooks';
import { isShallowEqual } from '../ZoomSdkService/utils/util';
import { useActiveVideo } from '../hooks/useAvtiveVideo';
import { usePagination } from '../hooks/usePagination';
import { useGalleryLayout } from '../hooks/useGalleryLayout';
import { ZoomDialogProps } from '../../../../api/types';

import './Video.scss';
import ZoomVideoFooter from './ZoomVideoFooter';

type StateProps = {
  zoomDialog: ZoomDialogProps;
  onLeaveSessionClicked: () => void;
  isVideoReady: boolean;
};

const Video: FC<StateProps> = ({
  zoomDialog,
  onLeaveSessionClicked,
  isVideoReady = false,
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

  const canvasDimension = useCanvasDimension(zoomDialog?.stream, videoRef);

  const [isSharing, setIsSharing] = useState(false);

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
    if (zoomDialog?.stream) {
      startAudioMuted();
    }
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
    throttle(() => {
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
    isVideoReady,
    videoRef,
    canvasDimension,
    {
      page,
      pageSize,
      totalPage,
      totalSize,
    },
  );

  return (
    <div className="VideoGalleryLayout">
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
          ref={videoRef}
        />
        <ul className="avatar-list">
          {visibleParticipants.map((user, index) => {
            if (index > videoLayout.length - 1) {
              return null;
            }
            const dimension = videoLayout[index];
            const {
              width,
              height,
              x,
              y,
            } = dimension;
            const { height: canvasHeight } = canvasDimension;
            let userId;
            try {
              const userAllData = decode(user.displayName);
              userId = JSON.parse(userAllData).i;
            } catch (e) {
              userId = user.userId;
            }
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
        initLeaveSessionClick={onLeaveSessionClicked}
      />
    </div>
  );
};
export default memo(Video);
