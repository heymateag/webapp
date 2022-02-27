import _ from 'lodash';
import {
  useState, useCallback, useEffect,
} from 'teact/teact';
import { MutableRefObject } from 'react';
import { useSizeCallback, useMount } from '../../../../hooks';
import { MediaStream } from '../ZoomSdkService/types';

export function useCanvasDimension(
  mediaStream: MediaStream | null,
  videoRef: MutableRefObject<HTMLCanvasElement | null>,
) {
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const onCanvasResize = useCallback(
    ({ width, height }) => {
      if (videoRef) {
        _.debounce((...args) => {
          setDimension({
            width: args[0],
            height: args[1],
          });
        }, 300).call(null, width, height);
      }
    },
    [videoRef],
  );
  useSizeCallback(videoRef.current, onCanvasResize);
  useMount(() => {
    if (videoRef.current) {
      const { width, height } = videoRef.current.getBoundingClientRect();
      if (dimension.width !== width || dimension.height !== height) {
        setDimension({ width, height });
      }
    }
  });
  useEffect(() => {
    const { width, height } = dimension;
    try {
      if (videoRef.current) {
        videoRef.current.width = width;
        videoRef.current.height = height;
      }
    } catch (e) {
      mediaStream?.updateVideoCanvasDimension(
        videoRef.current as HTMLCanvasElement,
        width,
        height,
      );
    }
  }, [mediaStream, dimension, videoRef]);
  return dimension;
}
