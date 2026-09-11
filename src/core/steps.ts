import { STEP_REFRACTORY_MS, STEP_THRESHOLD } from './constants';

export type StepDetector = {
  // Recebe o módulo da aceleração em g e o instante em ms.
  // Retorna true no exato momento em que um passo é confirmado.
  push(a: number, t: number): boolean;
};

export function createStepDetector(): StepDetector {
  let above = false;
  let lastStepAt = Number.NEGATIVE_INFINITY;

  return {
    push(a, t) {
      const wasAbove = above;
      above = a >= STEP_THRESHOLD;
      // Conta só na borda de subida e fora do período refratário
      if (above && !wasAbove && t - lastStepAt >= STEP_REFRACTORY_MS) {
        lastStepAt = t;
        return true;
      }
      return false;
    },
  };
}
