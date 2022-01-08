import { useEffect } from 'teact/teact';
import { EffectCallback } from 'react';

const useEffectOnce = (effect: EffectCallback) => {
  useEffect(effect, [effect]);
};

export default useEffectOnce;
