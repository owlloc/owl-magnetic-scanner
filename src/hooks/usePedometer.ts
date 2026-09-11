import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ACC_UPDATE_MS } from '../core/constants';
import { magnitude } from '../core/magnetics';
import { createStepDetector } from '../core/steps';

export type UsePedometer = {
  isAvailable: boolean | null; // null enquanto a checagem não terminou
  steps: number;
  distance: number; // metros
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function usePedometer(strideLength: number): UsePedometer {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState(0);

  // O detector guarda o estado do cruzamento e do refratário entre as
  // amostras, então precisa sobreviver aos re-renders.
  const detectorRef = useRef(createStepDetector());

  useEffect(() => {
    let montado = true;
    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (montado) setIsAvailable(ok);
      })
      .catch(() => {
        if (montado) setIsAvailable(false);
      });
    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    Accelerometer.setUpdateInterval(ACC_UPDATE_MS);
    const inscricao = Accelerometer.addListener(({ x, y, z }) => {
      // Mesmo módulo de vetor do magnetômetro, aqui sobre aceleração em g.
      // O timestamp do sensor vem em segundos, então o refratário usa Date.now().
      if (detectorRef.current.push(magnitude({ x, y, z }), Date.now())) {
        setSteps((anteriores) => anteriores + 1);
      }
    });

    return () => inscricao.remove();
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    detectorRef.current = createStepDetector();
    setSteps(0);
  }, []);

  return {
    isAvailable,
    steps,
    distance: steps * strideLength,
    isRunning,
    start,
    stop,
    reset,
  };
}
