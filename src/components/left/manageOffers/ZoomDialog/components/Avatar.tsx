import React from 'teact/teact';
import buildClassName from '../../../../../util/buildClassName';
import './ZoomAvatar.scss';
import { MeetingParticipants } from '../../ZoomSdkService/types';

interface AvatarProps {
  participant: MeetingParticipants;
  style?: { [key: string]: string };
  isActive: boolean;
  className?: string;
}
const Avatar = (props: AvatarProps) => {
  const {
    participant, style, isActive, className,
  } = props;
  const {
    displayName, audio, muted, bVideoOn,
  } = participant;
  return (
    <div
      className={buildClassName('avatar', isActive && 'avatar-active', className)}
      style={{ ...style, background: bVideoOn ? 'transparent' : 'rgb(26,26,26)' }}
    >
      {(bVideoOn || (audio === 'computer' && muted)) && (
        <div className="corner-name">
          {audio === 'computer' && muted && (
            <div>Bou azar</div>
          )}
          {bVideoOn && <span>{displayName}</span>}
        </div>
      )}
      {!bVideoOn && <p className="center-name">{displayName}</p>}
    </div>
  );
};

export default Avatar;
