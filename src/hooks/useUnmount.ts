import { useEffect, useRef } from 'teact/teact';
import useEffectOnce from './useEffectOnce';
export function useUnmount(fn: Function) {
  const fnRef = useRef<Function>(fn);
  fnRef.current = fn;
  useEffect(
    () => () => {
      if (fnRef.current) {
        fnRef.current();
      }
    },
    [],
  );
}

export const useMount = (fn: () => void) => {
  useEffectOnce(() => {
    fn();
  });
};
