import { STRIP_SEGMENTS } from './constants';
import type { Reading, RiskLevel, SessionStats } from './types';

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

  const totalLeituras = readings.length;
  return {
    min,
    max,
    mean: sum / totalLeituras,
    // passos e distância são acumulados, então bastam os da última leitura
    totalSteps: last.steps,
    totalDistance: last.distance,
    pctSafe: safe / totalLeituras,
    pctWarning: warning / totalLeituras,
    pctCritical: critical / totalLeituras,
  };
}

const SEVERIDADE: Record<RiskLevel, number> = { safe: 0, warning: 1, critical: 2 };

// Agrupa as leituras em blocos de largura fixa para a faixa colorida, cada
// bloco ficando com o pior nível que caiu nele. Sem isso a faixa viraria
// milhares de views numa varredura de poucos minutos. É o pior nível que
// importa: uma zona crítica curta não pode desaparecer numa média.
export function summarizeStrip(
  levels: RiskLevel[],
  segments: number = STRIP_SEGMENTS
): RiskLevel[] {
  if (levels.length === 0) return [];
  const total = Math.min(segments, levels.length);
  const blocos: RiskLevel[] = [];

  for (let i = 0; i < total; i++) {
    const inicio = Math.floor((i * levels.length) / total);
    const fim = Math.max(inicio + 1, Math.floor(((i + 1) * levels.length) / total));
    let pior: RiskLevel = 'safe';
    for (let j = inicio; j < fim; j++) {
      const nivel = levels[j];
      if (nivel !== undefined && SEVERIDADE[nivel] > SEVERIDADE[pior]) pior = nivel;
    }
    blocos.push(pior);
  }

  return blocos;
}
