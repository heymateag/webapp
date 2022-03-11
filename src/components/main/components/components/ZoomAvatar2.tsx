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
import { useRenderVideo } from '../hooks/useRenderVideo';

type RenderVideoProps = {
  mediaStream?: any;
  isVideoDecodeReady?: any;
  layout?: any;
  subscribedVideos?: any;
  visibleParticipants?: any;
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
const ZoomAvatar2: FC<AvatarProps & StateProps> = ({
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

  useRenderVideo(
    renderItems?.mediaStream,
    renderItems?.isVideoDecodeReady,
    videoCanvasRef,
    renderItems?.layout,
    renderItems?.subscribedVideos,
    renderItems?.visibleParticipants,
  );

  const isUseVideoElementToDrawSelfVideo = IS_ANDROID || isSupportOffscreenCanvas();

  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.style.background = bVideoOn ? 'transparent' : 'rgb(26,26,26)';
      avatarRef.current.style.width = style?.width || '50px';
      avatarRef.current.style.height = style?.height || '50px';
      avatarRef.current.style.top = style?.top || '50px';
      avatarRef.current.style.left = style?.left || '50px';
    }
    if (videoCanvasRef.current && !isSupportGalleryView) {
      videoCanvasRef.current.style.background = bVideoOn ? 'transparent' : 'rgb(26,26,26)';
      videoCanvasRef.current.style.width = style?.width || '50px';
      videoCanvasRef.current.style.height = style?.height || '50px';
      videoCanvasRef.current.style.top = style?.top || '50px';
      videoCanvasRef.current.style.left = style?.left || '50px';
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
            className="video-canvas"
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
)(ZoomAvatar2));
