import { STEP_REFRACTORY_MS, STEP_THRESHOLD } from './constants';

export type StepDetector = {
  // Recebe o módulo da aceleração em g e o instante em ms.
  // Retorna true no exato momento em que um passo é confirmado.
  push(a: number, t: number): boolean;
};

// Limiar e refratário são injetáveis só para permitir aferi-los em campo
// comparando contagens lado a lado. Sem argumento, valem as constantes.
export function createStepDetector(
  threshold: number = STEP_THRESHOLD,
  refractoryMs: number = STEP_REFRACTORY_MS
): StepDetector {
  let above = false;
  let lastStepAt = Number.NEGATIVE_INFINITY;

  return {
    push(a, t) {
      const wasAbove = above;
      above = a >= threshold;
      // Conta só na borda de subida e fora do período refratário
      if (above && !wasAbove && t - lastStepAt >= refractoryMs) {
        lastStepAt = t;
        return true;
      }
      return false;
    },
  };
}
