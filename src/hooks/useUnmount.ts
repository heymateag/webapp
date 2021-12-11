import { useEffect, useRef } from 'teact/teact';

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

export function useMount(fn: Function) {
  useEffect(() => {
    fn();
  }, [fn]);
}
