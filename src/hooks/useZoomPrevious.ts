import { useRef, useEffect } from 'teact/teact';

export function useZoomPrevious<T>(props: T): T | null {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = props;
  }, [props]);
  return ref.current;
}
