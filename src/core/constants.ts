import type { RiskLevel } from './types';

export const MAG_UPDATE_MS = 100; // 10 Hz
export const ACC_UPDATE_MS = 50; // 20 Hz, precisa pegar o pico do passo
export const SMOOTHING_WINDOW = 5;
export const CALIBRATION_MS = 3000;
export const WARNING_THRESHOLD = 0.15;
export const CRITICAL_THRESHOLD = 0.4;
// Aferido em campo. Com 20 passos lentos e deliberados: 1.18 g contou 8,
// 1.12 contou 15, 1.08 contou 22 e 1.04 disparou para 43. Mas no uso real
// da varredura, com o aparelho na mão e sendo movido, 1.08 contou passos
// demais: o próprio movimento do braço cruza o limiar. Voltou para 1.18,
// que erra para menos no passo lento mas não inventa passo parado.
export const STEP_THRESHOLD = 1.18; // em g, módulo da aceleração
export const STEP_REFRACTORY_MS = 280; // evita contagem dupla no mesmo impacto
export const DEFAULT_STRIDE_M = 0.7;
// Faixa plausível do campo terrestre medido por celular. Fora disso, ou há
// metal perto ou o magnetômetro está descalibrado.
export const BASELINE_MIN_UT = 20;
export const BASELINE_MAX_UT = 70;
export const COLORS: Record<RiskLevel, string> = {
  safe: '#16a34a',
  warning: '#eab308',
  critical: '#dc2626',
};

// Blocos da faixa de risco. Limita o desenho a um número fixo de views,
// em vez de uma por leitura.
export const STRIP_SEGMENTS = 120;

// Quantas anomalias a tela de resultado lista, e a distância mínima entre
// elas em leituras (a 10 Hz, 30 leituras são 3 s de caminhada). Sem essa
// separação, as três maiores seriam três leituras do mesmo ponto.
export const ANOMALY_COUNT = 3;
export const ANOMALY_MIN_SEPARATION = 30;

// Limiares da recomendação textual, em fração do percurso
export const HIGH_DENSITY_PCT = 0.3;
export const MODERATE_CRITICAL_PCT = 0.1;
export const MODERATE_WARNING_PCT = 0.4;

// Texto legível sobre cada cor de risco usada como fundo de tela
export const TEXT_ON_RISK: Record<RiskLevel, string> = {
  safe: '#ffffff',
  warning: '#000000',
  critical: '#ffffff',
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

// Escala tipográfica fechada. Qualquer tamanho fora desta lista é um
// desvio: o app inteiro se desenha com estes degraus.
export const TYPE = {
  display: 88, // leitura ao vivo da varredura
  hero: 56, // baseline e demais números de destaque
  title: 28,
  subtitle: 20,
  body: 15,
  small: 13,
  label: 11, // mono, maiúsculo, com letterSpacing
} as const;

// Espaçamento em múltiplos de 4, pelo mesmo motivo
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const FONTS = {
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemiBold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
} as const;
