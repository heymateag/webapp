import { useState, useCallback, useEffect } from 'teact/teact';
import { maxViewportVideoCounts } from '../ZoomSdkService/video-layout-helper';
import { useMount } from '../../../../hooks';
import { Dimension } from '../ZoomSdkService/video-types';
import { ClientType } from '../ZoomSdkService/types';

const MAX_NUMBER_PER_PAGE = 9;
// eslint-disable-next-line import/prefer-default-export
export function usePagination(zmClient: ClientType, dimension: Dimension) {
  const [page, setPage] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [pageSize, setPageSize] = useState(MAX_NUMBER_PER_PAGE);
  useEffect(() => {
    const size = Math.min(
      MAX_NUMBER_PER_PAGE,
      maxViewportVideoCounts(dimension.width, dimension.height),
    );
    setPageSize(size);
  }, [dimension]);
  const onParticipantsChange = useCallback(() => {
    setTotalSize(zmClient?.getAllUser().length);
  }, [zmClient]);
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
  useMount(() => {
    setTotalSize(zmClient?.getAllUser().length);
  });
  return {
    page,
    totalPage: Math.ceil(totalSize / pageSize),
    pageSize,
    totalSize,
    setPage,
  };
}
