import { useCallback } from 'teact/teact';

export function useBackHome(history: any) {
  const backToHome = useCallback(() => {
    history.goBack();
  }, [history]);
  return backToHome;
}
