import { STEP_REFRACTORY_MS, STEP_THRESHOLD } from './constants';

export type StepDetector = {
  // Recebe o módulo da aceleração em g e o instante em ms.
  // Retorna true no exato momento em que um passo é confirmado.
  push(a: number, t: number): boolean;
};

// O limiar é injetável só para permitir aferi-lo em campo comparando
// contagens lado a lado. Sem argumento, vale o STEP_THRESHOLD do spec.
export function createStepDetector(threshold: number = STEP_THRESHOLD): StepDetector {
  let above = false;
  let lastStepAt = Number.NEGATIVE_INFINITY;

  return {
    push(a, t) {
      const wasAbove = above;
      above = a >= threshold;
      // Conta só na borda de subida e fora do período refratário
      if (above && !wasAbove && t - lastStepAt >= STEP_REFRACTORY_MS) {
        lastStepAt = t;
        return true;
      }
      return false;
    },
  };
}
