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

interface AvatarProps {
  participant: MeetingParticipants;
  style?: { [key: string]: string };
  isActive: boolean;
  className?: string;
  currentUserId: string;
}
interface IParticipantMeta {
  firstName?: string;
  id?: string;
  avatarHash?: string;
  type?: string;
  isMin?: string;
  username?: string;
  phoneNumber?: string;
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
}) => {
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
          {bVideoOn && <span>{currentUser?.firstName}</span>}
        </div>
      )}
      {!bVideoOn && (
        <div>
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
