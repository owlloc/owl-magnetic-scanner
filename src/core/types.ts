// Uma amostra bruta do magnetômetro
export type MagSample = {
  x: number; // µT
  y: number; // µT
  z: number; // µT
  timestamp: number; // ms (Date.now())
};

// Uma leitura processada, já posicionada no percurso
export type Reading = {
  index: number;
  timestamp: number;
  magnitude: number; // µT, módulo do vetor
  deviationPct: number; // desvio percentual em relação ao baseline
  level: RiskLevel;
  steps: number; // passos acumulados até essa leitura
  distance: number; // metros acumulados
};

export type RiskLevel = 'safe' | 'warning' | 'critical';

export type Session = {
  id: string; // timestamp em string
  name: string; // informado pelo usuário, ex.: "Galpão A - corredor 3"
  startedAt: number;
  finishedAt: number;
  baseline: number; // µT de referência
  strideLength: number; // metros por passo usados nesta sessão
  readings: Reading[];
  stats: SessionStats;
};

export type SessionStats = {
  min: number;
  max: number;
  mean: number;
  totalSteps: number;
  totalDistance: number;
  pctSafe: number;
  pctWarning: number;
  pctCritical: number;
};
