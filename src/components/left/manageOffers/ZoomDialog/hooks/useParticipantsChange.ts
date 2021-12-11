import { useEffect, useRef, useCallback } from 'teact/teact';
import { useMount } from '../../../../../hooks';
import { ClientType, MeetingParticipants } from '../../ZoomSdkService/types';

export function useParticipantsChange(
  zmClient: ClientType,
  fn: (participants: MeetingParticipants[]) => void,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const callback = useCallback(() => {
    const participants = zmClient.getAllUser();
    fnRef.current && fnRef.current(participants);
  }, [zmClient]);
  useEffect(() => {
    zmClient.on('user-added', callback);
    zmClient.on('user-removed', callback);
    zmClient.on('user-updated', callback);
    return () => {
      zmClient.off('user-added', callback);
      zmClient.off('user-removed', callback);
      zmClient.off('user-updated', callback);
    };
  }, [zmClient, callback]);
  useMount(() => {
    callback();
  });
}
