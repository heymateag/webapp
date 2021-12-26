import React, { useEffect, useRef } from 'teact/teact';
import buildClassName from '../../../../../util/buildClassName';
import './ZoomAvatar.scss';
import { MeetingParticipants } from '../../ZoomSdkService/types';

interface AvatarProps {
  participant: MeetingParticipants;
  style?: { [key: string]: string };
  isActive: boolean;
  className?: string;
}
const ZoomAvatar = (props: AvatarProps) => {
  const {
    participant, style, isActive, className,
  } = props;
  const {
    displayName, audio, muted, bVideoOn,
  } = participant;

  const avatarRef = useRef<HTMLDivElement | null>(null);

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
      {(bVideoOn || (audio === 'computer' && muted)) && (
        <div className="corner-name">
          {audio === 'computer' && muted && (
            <div>Muted Audio</div>
          )}
          {bVideoOn && <span>{displayName}</span>}
        </div>
      )}
      {!bVideoOn && <p className="center-name">{displayName}</p>}
    </div>
  );
};

export default ZoomAvatar;
