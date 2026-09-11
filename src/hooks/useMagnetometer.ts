import { Magnetometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';

import { MAG_UPDATE_MS, SMOOTHING_WINDOW } from '../core/constants';
import { magnitude, movingAverage } from '../core/magnetics';
import type { MagSample } from '../core/types';

export type UseMagnetometer = {
  isAvailable: boolean | null; // null enquanto a checagem não terminou
  raw: MagSample | null;
  smoothed: number | null; // µT já com média móvel
  samples: MagSample[];
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function useMagnetometer(): UseMagnetometer {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [raw, setRaw] = useState<MagSample | null>(null);
  const [smoothed, setSmoothed] = useState<number | null>(null);
  const [samples, setSamples] = useState<MagSample[]>([]);

  useEffect(() => {
    let montado = true;
    Magnetometer.isAvailableAsync()
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

    Magnetometer.setUpdateInterval(MAG_UPDATE_MS);
    // Janela curta viva na própria closure: a média móvel não precisa
    // varrer o histórico inteiro a cada amostra.
    let janela: number[] = [];

    const inscricao = Magnetometer.addListener(({ x, y, z }) => {
      // O timestamp do sensor vem em segundos e com origem própria do
      // aparelho, então o domínio carimba Date.now() em ms.
      const amostra: MagSample = { x, y, z, timestamp: Date.now() };
      janela = [...janela, magnitude(amostra)].slice(-SMOOTHING_WINDOW);
      const media = movingAverage(janela, SMOOTHING_WINDOW);

      setRaw(amostra);
      setSmoothed(media[media.length - 1] ?? null);
      setSamples((anteriores) => [...anteriores, amostra]);
    });

    // Sem este remove o listener vaza e trava o app depois de algumas navegações
    return () => inscricao.remove();
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setSamples([]);
    setRaw(null);
    setSmoothed(null);
  }, []);

  return { isAvailable, raw, smoothed, samples, isRunning, start, stop, reset };
}
