import {
  useState, useCallback, useEffect,
} from 'teact/teact';
import { MutableRefObject } from 'react';

import { getVideoLayout } from '../ZoomSdkService/video-layout-helper';
import { Dimension, Pagination, CellLayout } from '../ZoomSdkService/video-types';
import { ClientType, MediaStream, MeetingParticipants } from '../ZoomSdkService/types';
/**
 * Default order of video:
 *  1. video's participants first
 *  2. self on the second position
 */
export function useGalleryLayoutNoRender(
  zmClient: ClientType,
  mediaStream: MediaStream | null,
  isVideoDecodeReady: boolean,
  videoRef: MutableRefObject<HTMLCanvasElement | null>,
  dimension: Dimension,
  pagination: Pagination,
) {
  const [visibleParticipants, setVisibleParticipants] = useState<MeetingParticipants[]>([]);
  const [layout, setLayout] = useState<CellLayout[]>([]);
  const [subscribedVideos, setSubscribedVideos] = useState<number[]>([]);
  const {
    page, pageSize, totalPage, totalSize,
  } = pagination;
  let size = pageSize;
  if (page === totalPage - 1) {
    size = Math.min(size, totalSize % pageSize || size);
  }

  useEffect(() => {
    console.log('===page size ===');
    console.log(size);
    const videoLay = getVideoLayout(dimension.width, dimension.height, size);
    console.log('===video layouts ===');
    console.log(videoLay);
    setLayout(getVideoLayout(dimension.width, dimension.height, size));
  }, [dimension, size]);

  const onParticipantsChange = useCallback(() => {
    const participants = zmClient?.getAllUser();
    const currentUser = zmClient?.getCurrentUserInfo();
    if (currentUser && participants.length > 0) {
      let pageParticipants: any[] = [];
      if (participants.length === 1) {
        pageParticipants = participants;
      } else {
        pageParticipants = participants
          .filter((user) => user.userId !== currentUser.userId)
          .sort((user1, user2) => Number(user2.bVideoOn) - Number(user1.bVideoOn));
        pageParticipants.splice(1, 0, currentUser);
        pageParticipants = pageParticipants.filter(
          (_user, index) => Math.floor(index / pageSize) === page,
        );
      }
      setVisibleParticipants(pageParticipants);
      const videoParticipants = pageParticipants
        .filter((user) => user.bVideoOn)
        .map((user) => user.userId);
      setSubscribedVideos(videoParticipants);
    }
  }, [zmClient, page, pageSize]);
  useEffect(() => {
    zmClient?.on('user-added', onParticipantsChange);
    zmClient?.on('user-removed', onParticipantsChange);
    zmClient?.on('user-updated', onParticipantsChange);
    return () => {
      zmClient?.off('user-added', onParticipantsChange);
      zmClient?.off('user-removed', onParticipantsChange);
      zmClient?.off('user-updated', onParticipantsChange);
    };
  }, [zmClient, onParticipantsChange]);
  useEffect(() => {
    onParticipantsChange();
  }, [onParticipantsChange]);

  return {
    visibleParticipants,
    subscribedVideos,
    layout,
  };
}
