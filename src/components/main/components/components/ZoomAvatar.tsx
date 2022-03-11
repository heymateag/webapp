import React, {
  FC,
  memo, useEffect, useRef, useState,
} from 'teact/teact';
import { withGlobal } from 'teact/teactn';
import buildClassName from '../../../../util/buildClassName';
import './ZoomAvatar.scss';
import { MeetingParticipants } from '../ZoomSdkService/types';
import Avatar from '../../../common/Avatar';

import { selectUser } from '../../../../modules/selectors';
import { ApiUser } from '../../../../api/types';
import { IS_ANDROID } from '../../../../util/environment';

type RenderVideoProps = {
  mediaStream?: any;
  isVideoDecodeReady?: any;
  layout?: any;
  subscribedVideos?: any;
  visibleParticipants?: any;
  zoomClient?: any;
};

interface AvatarProps {
  participant: MeetingParticipants;
  style?: { [key: string]: string };
  isActive: boolean;
  className?: string;
  currentUserId: string;
  isSupportGalleryView?: boolean;
  renderItems?: RenderVideoProps;
}

type StateProps = {
  currentUser?: ApiUser;
};
const ZoomAvatar: FC<AvatarProps & StateProps> = ({
  participant,
  style,
  isActive,
  className,
  currentUser,
  isSupportGalleryView = true,
  renderItems = undefined,
}) => {
  function isSupportOffscreenCanvas() {
    return typeof (window as any).OffscreenCanvas === 'function';
  }

  const {
    displayName, audio, muted, bVideoOn, userId,
  } = participant;

  const avatarRef = useRef<HTMLDivElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement & HTMLVideoElement>(null);
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(async () => {
    if (renderItems?.mediaStream && videoCanvasRef.current && renderItems.isVideoDecodeReady && !isSupportGalleryView) {
      const index = renderItems.visibleParticipants.findIndex((user) => user.userId === userId);
      const cellDimension = renderItems.layout[index];
      console.log('=== User first render dim ');
      console.log(cellDimension);
      const {
        width, height, x, y, quality,
      } = cellDimension;
      videoCanvasRef.current.style.background = bVideoOn ? 'transparent' : 'rgb(26,26,26)';
      videoCanvasRef.current.style.width = `${width}px`;
      videoCanvasRef.current.style.height = `${height}px`;
      videoCanvasRef.current.style.top = `${y}px`;
      videoCanvasRef.current.style.left = `${x}px`;
      if (bVideoOn && !videoStarted) {
        console.log(`=== User ${userId} started video`);
        setVideoStarted(true);
        await renderItems?.mediaStream.renderVideo(
          videoCanvasRef.current,
          userId,
          width,
          height,
          0,
          0,
          quality,
        );
      } else if (bVideoOn && videoStarted) {
        setVideoStarted(true);
        console.log('=== New Render With');
        console.log(cellDimension);
        await renderItems?.mediaStream.clearVideoCanvas(videoCanvasRef.current);
        await renderItems?.mediaStream.renderVideo(
          videoCanvasRef.current,
          userId,
          width,
          height,
          0,
          0,
        );
      } else if (!bVideoOn && videoStarted) {
        setVideoStarted(false);
        console.log(`=== User ${userId} stoped video`);
        await renderItems?.mediaStream.clearVideoCanvas(videoCanvasRef.current);
        await renderItems?.mediaStream.stopRenderVideo(
          videoCanvasRef.current,
          userId,
        );
      }
    }
  }, [renderItems?.mediaStream,
    videoStarted,
    renderItems?.isVideoDecodeReady,
    style,
    renderItems?.visibleParticipants,
    renderItems?.layout, bVideoOn, userId, isSupportGalleryView]);

  const isUseVideoElementToDrawSelfVideo = IS_ANDROID || isSupportOffscreenCanvas();

  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.style.background = bVideoOn ? 'transparent' : 'rgb(26,26,26)';
      avatarRef.current.style.width = style?.width || '50px';
      avatarRef.current.style.height = style?.height || '50px';
      avatarRef.current.style.top = style?.top || '50px';
      avatarRef.current.style.left = style?.left || '50px';
    }
  }, [bVideoOn, style?.height, style?.left, style?.top, style?.width]);
  return (
    <div
      ref={avatarRef}
      className={buildClassName('avatar', isActive && 'avatar-active', className)}
    >

      {!isSupportGalleryView && (
        <div>
          <canvas
            key={userId}
            id={`video-canvas-${userId}`}
            ref={videoCanvasRef}
          />
          {isUseVideoElementToDrawSelfVideo && (
            <video
              key={userId}
              id={`video-canvas-${userId}`}
              ref={videoCanvasRef}
            />
          )}
        </div>
      )}

      {(bVideoOn || (audio === 'computer' && muted)) && (
        <div className="corner-name">
          {audio === 'computer' && muted && (
            <div>Muted Audio</div>
          )}
          {bVideoOn && <span>{currentUser?.firstName}</span>}
        </div>
      )}
      {!bVideoOn && (
        <div className={buildClassName(!isSupportGalleryView && 'float-avatar')}>
          <p className="center-name">{currentUser?.firstName}</p>
          {currentUser && (
            <Avatar
              size="tiny"
              user={currentUser}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default memo(withGlobal<AvatarProps>(
  (global, { currentUserId }): StateProps => {
    return {
      currentUser: currentUserId ? selectUser(global, currentUserId) : undefined,
    };
  },
)(ZoomAvatar));
