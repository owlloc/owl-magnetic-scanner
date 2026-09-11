import type { Reading, Session } from './types';

const CABECALHO = 'index,timestamp,steps,distance_m,magnitude_uT,deviation_pct,level';

// Ponto decimal, nunca vírgula: a vírgula é o separador de coluna do CSV.
function numero(valor: number, casas: number): string {
  return valor.toFixed(casas);
}

// A coluna se chama deviation_pct, então sai em porcentagem (57.80) e não
// na fração usada internamente (0.578).
export function toCsv(readings: Reading[]): string {
  const linhas = readings.map((r) =>
    [
      String(r.index),
      String(r.timestamp),
      String(r.steps),
      numero(r.distance, 2),
      numero(r.magnitude, 2),
      numero(r.deviationPct * 100, 2),
      r.level,
    ].join(',')
  );
  return [CABECALHO, ...linhas].join('\n');
}

// Nome de arquivo seguro: sem acento, sem espaço, sem caractere que o
// sistema de arquivos ou o app de e-mail possa rejeitar.
export function csvFileName(session: Session): string {
  const base = session.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const data = new Date(session.startedAt);
  const doisDigitos = (n: number): string => String(n).padStart(2, '0');
  const carimbo = [
    data.getFullYear(),
    doisDigitos(data.getMonth() + 1),
    doisDigitos(data.getDate()),
    doisDigitos(data.getHours()),
    doisDigitos(data.getMinutes()),
  ].join('');

  return `magscan-${base === '' ? 'sem-nome' : base}-${carimbo}.csv`;
}
