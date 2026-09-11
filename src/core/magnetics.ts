import { CRITICAL_THRESHOLD, WARNING_THRESHOLD } from './constants';
import type { RiskLevel } from './types';

// Módulo do vetor: aproximadamente invariante à rotação do celular
export function magnitude(s: { x: number; y: number; z: number }): number {
  return Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
}

// Mediana e não média: um único outlier não desloca o baseline
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

// Média móvel com janela "para trás". Nas primeiras posições a janela é
// menor, para que a varredura já tenha valor desde a primeira amostra.
export function movingAverage(values: number[], window: number): number[] {
  const size = Math.max(1, Math.floor(window));
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= size) sum -= values[i - size];
    out.push(sum / Math.min(i + 1, size));
  }
  return out;
}

export function deviation(value: number, baseline: number): number {
  if (baseline === 0) return 0; // baseline zero não ocorre com sensor válido
  return Math.abs(value - baseline) / baseline;
}

export function classify(deviationPct: number): RiskLevel {
  if (deviationPct >= CRITICAL_THRESHOLD) return 'critical';
  if (deviationPct >= WARNING_THRESHOLD) return 'warning';
  return 'safe';
}
