import type { RiskLevel } from './types';

export const MAG_UPDATE_MS = 100; // 10 Hz
export const ACC_UPDATE_MS = 50; // 20 Hz, precisa pegar o pico do passo
export const SMOOTHING_WINDOW = 5;
export const CALIBRATION_MS = 3000;
export const WARNING_THRESHOLD = 0.15;
export const CRITICAL_THRESHOLD = 0.4;
// Aferido em campo com 20 passos lentos: 1.18 g contou 8, 1.12 contou 15,
// 1.08 contou 22 e 1.04 disparou para 43. Andando devagar o impacto do pé
// mal passa de 1.10 g, então o 1.18 do spec perdia a maioria dos passos.
export const STEP_THRESHOLD = 1.08; // em g, módulo da aceleração
export const STEP_REFRACTORY_MS = 280; // evita contagem dupla no mesmo impacto
export const DEFAULT_STRIDE_M = 0.7;
export const COLORS: Record<RiskLevel, string> = {
  safe: '#16a34a',
  warning: '#eab308',
  critical: '#dc2626',
};

// Identidade visual da OWL, espelhada de owl-landing-page/src/app/globals.css
export const THEME = {
  bg: '#000000',
  surface: '#0a0a0a',
  border: '#1f1f1f',
  fg: '#ffffff',
  muted: '#71717a',
  accent: '#5dbf4e',
} as const;

export const FONTS = {
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemiBold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
} as const;
