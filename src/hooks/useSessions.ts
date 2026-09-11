import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { Session } from '../core/types';

const CHAVE = '@owl_magscan_sessions';

// Validação mínima: JSON meio gravado ou de uma versão antiga do app não
// pode derrubar a Home na abertura.
function ehSessao(valor: unknown): valor is Session {
  if (typeof valor !== 'object' || valor === null) return false;
  const s = valor as Partial<Session>;
  return typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.readings);
}

async function lerTudo(): Promise<Session[]> {
  const bruto = await AsyncStorage.getItem(CHAVE);
  if (bruto === null) return [];
  try {
    const analisado: unknown = JSON.parse(bruto);
    return Array.isArray(analisado) ? analisado.filter(ehSessao) : [];
  } catch {
    return [];
  }
}

async function gravarTudo(sessoes: Session[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(sessoes));
}

export type UseSessions = {
  sessions: Session[]; // mais recentes primeiro
  isLoading: boolean;
  list: () => Promise<Session[]>;
  save: (sessao: Session) => Promise<void>;
  get: (id: string) => Promise<Session | null>;
  remove: (id: string) => Promise<void>;
};

export function useSessions(): UseSessions {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const list = useCallback(async () => {
    const guardadas = await lerTudo();
    const ordenadas = [...guardadas].sort((a, b) => b.startedAt - a.startedAt);
    setSessions(ordenadas);
    setIsLoading(false);
    return ordenadas;
  }, []);

  useEffect(() => {
    void list();
  }, [list]);

  const save = useCallback(
    async (sessao: Session) => {
      // Relê antes de gravar: o estado em memória pode estar defasado
      const guardadas = await lerTudo();
      const semDuplicata = guardadas.filter((s) => s.id !== sessao.id);
      await gravarTudo([...semDuplicata, sessao]);
      await list();
    },
    [list]
  );

  const get = useCallback(async (id: string) => {
    const guardadas = await lerTudo();
    return guardadas.find((s) => s.id === id) ?? null;
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const guardadas = await lerTudo();
      await gravarTudo(guardadas.filter((s) => s.id !== id));
      await list();
    },
    [list]
  );

  return { sessions, isLoading, list, save, get, remove };
}
