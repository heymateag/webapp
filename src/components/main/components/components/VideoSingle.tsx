import React, {
  FC, memo, useMemo, useCallback, useEffect, useRef, useState,
} from 'teact/teact';
import { VideoQuality } from '@zoom/videosdk';
import _ from 'lodash';
import { decode } from 'js-base64';
import buildClassName from '../../../../util/buildClassName';

import ZoomVideoFooter from './ZoomVideoFooter';
import ZoomAvatar from './ZoomAvatar';
import { useShare } from '../hooks/useShare';
import { useParticipantsChange } from '../hooks/useParticipantsChange';
import { useCanvasDimension } from '../hooks/useCanvasDimension';
import { useSizeCallback, useMount } from '../../../../hooks';
import { useGalleryLayoutNoRender } from '../hooks/useGalleryLayoutNoRender';

import { MeetingParticipants } from '../ZoomSdkService/types';
import './VideoSingle.scss';

import { IS_ANDROID } from '../../../../util/environment';

import { isShallowEqual } from '../ZoomSdkService/utils/util';
import { ZoomDialogProps } from '../../../../api/types';
import { useGalleryLayout } from '../hooks/useGalleryLayout';
import { usePagination } from '../hooks/usePagination';

type OwnProps = {
  zoomDialog: ZoomDialogProps;
  onLeaveSessionClicked: () => void;
  isVideoReady: boolean;
};
const VideoSingle: FC<OwnProps> = ({
  zoomDialog,
  onLeaveSessionClicked,
  isVideoReady = false,
}) => {
  const isSupportWebCodecs = () => {
    return typeof (window as any).MediaStreamTrackProcessor === 'function';
  };

  function isSupportOffscreenCanvas() {
    return typeof (window as any).OffscreenCanvas === 'function';
  }

  const isUseVideoElementToDrawSelfVideo = IS_ANDROID || isSupportOffscreenCanvas();

  const SELF_VIDEO_ID = 'ZOOM_WEB_SDK_SELF_VIDEO';

  const videoRef = useRef<HTMLCanvasElement | null>(null);
  const shareRef = useRef<HTMLCanvasElement | null>(null);
  const selfShareRef = useRef<HTMLCanvasElement & HTMLVideoElement>(null);
  const shareContainerRef = useRef<HTMLDivElement | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipants[]>([]);
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const previousActiveUser = useRef<MeetingParticipants>();

  const canvasDimension = useCanvasDimension(zoomDialog.stream, videoRef);

  const {
    page, pageSize, totalPage, totalSize, setPage,
  } = usePagination(
    zoomDialog.zoomClient,
    canvasDimension,
  );

  const { visibleParticipants, subscribedVideos, layout: videoLayout } = useGalleryLayoutNoRender(
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

  const { isRecieveSharing, isStartedShare, sharedContentDimension } = useShare(
    zoomDialog.zoomClient,
    zoomDialog.stream,
    shareRef,
  );

  const isSharing = isRecieveSharing || isStartedShare;

  const [containerDimension, setContainerDimension] = useState({
    width: 0,
    height: 0,
  });
  const [shareViewDimension, setShareViewDimension] = useState({
    width: 0,
    height: 0,
  });

  useParticipantsChange(zoomDialog.zoomClient, (payload) => {
    setParticipants(payload);
  });
  const onActiveVideoChange = useCallback((payload) => {
    const { userId } = payload;
    setActiveVideo(userId);
  }, []);
  useEffect(() => {
    zoomDialog?.zoomClient.on('video-active-change', onActiveVideoChange);
    return () => {
      zoomDialog.zoomClient.off('video-active-change', onActiveVideoChange);
    };
  }, [zoomDialog.zoomClient, onActiveVideoChange]);

  const activeUser = useMemo(
    () => participants.find((user) => user.userId === activeVideo),
    [participants, activeVideo],
  );
  const isCurrentUserStartedVideo = zoomDialog.zoomClient.getCurrentUserInfo()?.bVideoOn;

  // useEffect(() => {
  //   if (zoomDialog.stream && videoRef.current && isVideoReady) {
  //     if (activeUser?.bVideoOn !== previousActiveUser.current?.bVideoOn) {
  //       if (activeUser?.bVideoOn) {
  //         zoomDialog.stream.renderVideo(
  //           videoRef.current,
  //           activeUser.userId,
  //           canvasDimension.width,
  //           canvasDimension.height,
  //           0,
  //           0,
  //           VideoQuality.Video_360P as any,
  //         );
  //       } else if (previousActiveUser.current?.bVideoOn) {
  //         zoomDialog.stream.stopRenderVideo(
  //           videoRef.current,
  //           previousActiveUser.current?.userId,
  //         );
  //       }
  //     }
  //     if (
  //       activeUser?.bVideoOn
  //       && previousActiveUser.current?.bVideoOn
  //       && activeUser.userId !== previousActiveUser.current.userId
  //     ) {
  //       zoomDialog.stream.stopRenderVideo(
  //         videoRef.current,
  //         previousActiveUser.current?.userId,
  //       );
  //       zoomDialog.stream.renderVideo(
  //         videoRef.current,
  //         activeUser.userId,
  //         canvasDimension.width,
  //         canvasDimension.height,
  //         0,
  //         0,
  //         VideoQuality.Video_360P as any,
  //       );
  //     }
  //     previousActiveUser.current = activeUser;
  //   }
  // }, [zoomDialog.stream, activeUser, isVideoReady, canvasDimension]);

  useMount(() => {
    if (zoomDialog.stream) {
      setActiveVideo(zoomDialog.stream.getActiveVideoId());
    }
  });
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
  return (
    <div className="SingleVideoLayout">
      <div
        className={buildClassName('share-container', isSharing && 'in-sharing')}
        ref={shareContainerRef}
      >
        <div
          className="share-container-viewport"
          style={{
            width: `${shareViewDimension.width}px`,
            height: `${shareViewDimension.height}px`,
          }}
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
      <div className={buildClassName('video-container', isSharing && 'in-sharing')}>
        <canvas
          className="video-canvas"
          id="video-canvas"
          width="800"
          height="600"
          ref={videoRef}
        />
        {isUseVideoElementToDrawSelfVideo && (
          <video
            id={SELF_VIDEO_ID}
            className={buildClassName('self-video',
              (participants.length === 1) && 'single-self-video',
              isCurrentUserStartedVideo && 'self-video-show')}
          />
        )}
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
                renderItems={
                  {
                    mediaStream: zoomDialog.stream,
                    isVideoDecodeReady: isVideoReady,
                    layout: videoLayout,
                    subscribedVideos,
                    visibleParticipants,
                    zoomClient: zoomDialog.zoomClient,
                  }
                }
                isSupportGalleryView={false}
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

export default memo(VideoSingle);
