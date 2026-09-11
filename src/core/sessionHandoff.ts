import type { Session } from './types';

// Passagem em memória da varredura para a tela de resultado. É o mínimo
// para o botão Finalizar não jogar fora o percurso caminhado. A T8 troca
// isto por persistência de verdade em AsyncStorage.
let sessaoRecente: Session | null = null;

export function guardarSessao(sessao: Session): void {
  sessaoRecente = sessao;
}

export function recuperarSessao(id: string): Session | null {
  return sessaoRecente !== null && sessaoRecente.id === id ? sessaoRecente : null;
}
