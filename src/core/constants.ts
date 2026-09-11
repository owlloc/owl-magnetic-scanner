import type { RiskLevel } from './types';

export const MAG_UPDATE_MS = 100; // 10 Hz
export const ACC_UPDATE_MS = 50; // 20 Hz, precisa pegar o pico do passo
export const SMOOTHING_WINDOW = 5;
export const CALIBRATION_MS = 3000;
export const WARNING_THRESHOLD = 0.15;
export const CRITICAL_THRESHOLD = 0.4;
export const STEP_THRESHOLD = 1.18; // em g, módulo da aceleração
export const STEP_REFRACTORY_MS = 280; // evita contagem dupla no mesmo impacto
export const DEFAULT_STRIDE_M = 0.7;
export const COLORS: Record<RiskLevel, string> = {
  safe: '#16a34a',
  warning: '#eab308',
  critical: '#dc2626',
};
