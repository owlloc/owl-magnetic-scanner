import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RiskStrip } from '../src/components/RiskStrip';
import { COLORS, FONTS, SPACING, TEXT_ON_RISK, THEME, TYPE } from '../src/core/constants';
import { classify, deviation } from '../src/core/magnetics';
import { computeStats } from '../src/core/stats';
import type { Reading, RiskLevel } from '../src/core/types';
import { useMagnetometer } from '../src/hooks/useMagnetometer';
import { usePedometer } from '../src/hooks/usePedometer';
import { useSessions } from '../src/hooks/useSessions';

export default function Varredura() {
  useKeepAwake(); // a tela não pode apagar no meio da varredura

  const params = useLocalSearchParams<{ nome?: string; passada?: string; baseline?: string }>();
  const nome = params.nome ?? 'Sem nome';
  const passada = Number(params.passada);
  const baseline = Number(params.baseline);
  const parametrosValidos =
    Number.isFinite(passada) && passada > 0 && Number.isFinite(baseline) && baseline > 0;

  const mag = useMagnetometer();
  const passos = usePedometer(parametrosValidos ? passada : 0);

  const { save } = useSessions();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [capturando, setCapturando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const inicioRef = useRef(Date.now());
  const nivelAnteriorRef = useRef<RiskLevel | null>(null);
  // Últimos passos e distância lidos, para a leitura não usar valor velho
  const passosRef = useRef({ steps: 0, distance: 0 });
  passosRef.current = { steps: passos.steps, distance: passos.distance };

  useEffect(() => {
    if (!parametrosValidos) return;
    mag.start();
    passos.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parametrosValidos]);

  // Cada amostra nova do magnetômetro vira uma leitura posicionada no percurso
  useEffect(() => {
    if (!capturando || mag.smoothed === null) return;
    const magnitudeSuavizada = mag.smoothed;
    const desvio = deviation(magnitudeSuavizada, baseline);
    setReadings((anteriores) => [
      ...anteriores,
      {
        index: anteriores.length,
        timestamp: Date.now(),
        magnitude: magnitudeSuavizada,
        deviationPct: desvio,
        level: classify(desvio),
        steps: passosRef.current.steps,
        distance: passosRef.current.distance,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mag.samples.length]);

  const ultima = readings[readings.length - 1];
  const nivel: RiskLevel = ultima?.level ?? 'safe';

  // Háptico só na transição de nível, nunca a cada leitura
  useEffect(() => {
    if (ultima === undefined) return;
    const anterior = nivelAnteriorRef.current;
    if (anterior === ultima.level) return;
    nivelAnteriorRef.current = ultima.level;
    if (anterior === null) return; // a primeira leitura não vibra

    if (ultima.level === 'critical') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (ultima.level === 'warning') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [ultima]);

  const finalizar = async () => {
    if (salvando) return;
    setSalvando(true);
    setCapturando(false);
    mag.stop();
    passos.stop();

    const id = String(inicioRef.current);
    // Grava antes de navegar: o resultado lê do armazenamento, não da memória
    await save({
      id,
      name: nome,
      startedAt: inicioRef.current,
      finishedAt: Date.now(),
      baseline,
      strideLength: passada,
      readings,
      stats: computeStats(readings),
    });
    router.replace({ pathname: '/resultado/[id]', params: { id } });
  };

  if (!parametrosValidos) {
    return (
      <SafeAreaView style={[styles.tela, styles.telaErro]}>
        <Text style={styles.erroTitulo}>Parâmetros inválidos</Text>
        <Text style={styles.erroTexto}>
          A varredura precisa de um baseline e de uma passada válidos. Volte e calibre antes de
          começar.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.botaoErro}
        >
          <Text style={styles.botaoErroTexto}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const corTexto = TEXT_ON_RISK[nivel];
  const sinal = ultima !== undefined && ultima.magnitude < baseline ? '−' : '+';

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: COLORS[nivel] }]}>
      <View style={styles.topo}>
        <Text style={[styles.local, { color: corTexto }]} numberOfLines={1}>
          {nome}
        </Text>
        <Text style={[styles.referencia, { color: corTexto }]}>
          base {formatar(baseline, 1)} µT
        </Text>
      </View>

      <View style={styles.centro}>
        <View style={styles.medida}>
          <Text style={[styles.numero, { color: corTexto }]}>
            {ultima === undefined ? '--' : formatar(ultima.magnitude, 1)}
          </Text>
          <Text style={[styles.unidade, { color: corTexto }]}>µT</Text>
        </View>
        <Text style={[styles.desvio, { color: corTexto }]}>
          {ultima === undefined ? '--' : `${sinal}${formatar(ultima.deviationPct * 100, 0)}%`}
        </Text>
        <Text style={[styles.nivel, { color: corTexto }]}>{ROTULO_NIVEL[nivel]}</Text>
      </View>

      <View style={styles.contadores}>
        <Contador rotulo="PASSOS" valor={String(passos.steps)} cor={corTexto} />
        <Contador rotulo="DISTÂNCIA" valor={`${formatar(passos.distance, 1)} m`} cor={corTexto} />
        <Contador rotulo="LEITURAS" valor={String(readings.length)} cor={corTexto} />
      </View>

      <View style={styles.rodape}>
        <RiskStrip levels={readings.map((r) => r.level)} />
        <Pressable
          onPress={() => void finalizar()}
          disabled={salvando}
          accessibilityRole="button"
          style={styles.finalizar}
        >
          <Text style={styles.finalizarTexto}>{salvando ? 'Salvando...' : 'Finalizar'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const ROTULO_NIVEL: Record<RiskLevel, string> = {
  safe: 'ZONA LIMPA',
  warning: 'ATENÇÃO',
  critical: 'ZONA CRÍTICA',
};

// Vírgula decimal, como se escreve em português
function formatar(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

function Contador({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <View style={styles.contador}>
      <Text style={[styles.contadorRotulo, { color: cor }]}>{rotulo}</Text>
      <Text style={[styles.contadorValor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  telaErro: {
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    gap: SPACING.md,
  },
  erroTitulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.title,
    letterSpacing: -0.8,
    color: THEME.fg,
  },
  erroTexto: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.body,
    lineHeight: 24,
    color: THEME.muted,
  },
  botaoErro: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: THEME.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 3,
  },
  botaoErroTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.bg,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingTop: SPACING.md,
  },
  local: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
  },
  referencia: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label,
    opacity: 0.75,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  medida: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  numero: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.display,
    letterSpacing: -3,
  },
  unidade: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.subtitle,
    opacity: 0.85,
  },
  desvio: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.title,
    letterSpacing: -1,
  },
  nivel: {
    fontFamily: FONTS.monoMedium,
    fontSize: TYPE.label,
    letterSpacing: 3,
    paddingTop: SPACING.sm,
    opacity: 0.9,
  },
  contadores: {
    flexDirection: 'row',
    gap: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  contador: {
    gap: SPACING.xs,
  },
  contadorRotulo: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label,
    letterSpacing: 1.6,
    opacity: 0.75,
  },
  contadorValor: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.subtitle,
  },
  rodape: {
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  finalizar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: THEME.bg,
    paddingVertical: SPACING.md + 3,
  },
  finalizarTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.fg,
  },
});
