import type { Reading, SessionStats } from './types';

const EMPTY_STATS: SessionStats = {
  min: 0,
  max: 0,
  mean: 0,
  totalSteps: 0,
  totalDistance: 0,
  pctSafe: 0,
  pctWarning: 0,
  pctCritical: 0,
};

// As proporções saem como fração de 0 a 1, igual ao deviationPct.
// Formatar em porcentagem é responsabilidade da tela.
export function computeStats(readings: Reading[]): SessionStats {
  const last = readings[readings.length - 1];
  if (last === undefined) return { ...EMPTY_STATS };

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  let safe = 0;
  let warning = 0;
  let critical = 0;

  for (const r of readings) {
    if (r.magnitude < min) min = r.magnitude;
    if (r.magnitude > max) max = r.magnitude;
    sum += r.magnitude;
    if (r.level === 'safe') safe++;
    else if (r.level === 'warning') warning++;
    else critical++;
  }

  const total = readings.length;
  return {
    min,
    max,
    mean: sum / total,
    // passos e distância são acumulados, então bastam os da última leitura
    totalSteps: last.steps,
    totalDistance: last.distance,
    pctSafe: safe / total,
    pctWarning: warning / total,
    pctCritical: critical / total,
  };
}
