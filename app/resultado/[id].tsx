import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RiskStrip } from '../../src/components/RiskStrip';
import { StatCard } from '../../src/components/StatCard';
import { COLORS, FONTS, SPACING, THEME, TYPE } from '../../src/core/constants';
import { csvFileName, toCsv } from '../../src/core/csv';
import { recommendation, topAnomalies } from '../../src/core/stats';
import type { Reading, RiskLevel, Session } from '../../src/core/types';
import { useSessions } from '../../src/hooks/useSessions';

export default function Resultado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get } = useSessions();
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let montado = true;
    void get(id).then((encontrada) => {
      if (!montado) return;
      setSessao(encontrada);
      setCarregando(false);
    });
    return () => {
      montado = false;
    };
  }, [id, get]);

  if (carregando) {
    return <SafeAreaView style={styles.tela} />;
  }

  if (sessao === null) {
    return (
      <SafeAreaView style={[styles.tela, styles.telaVazia]}>
        <Text style={styles.vazioTitulo}>Varredura não encontrada</Text>
        <Text style={styles.vazioTexto}>
          Esta varredura não está salva neste aparelho. Talvez tenha sido apagada.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          style={styles.botaoVazio}
        >
          <Text style={styles.botaoVazioTexto}>Voltar ao início</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { stats, readings, baseline } = sessao;
  const anomalias = topAnomalies(readings);
  const niveis = readings.map((r) => r.level);
  const meio = stats.totalDistance / 2;

  const exportar = async () => {
    if (exportando) return;
    setExportando(true);
    try {
      // Cache: o arquivo só precisa viver até a folha de compartilhamento
      const arquivo = new File(Paths.cache, csvFileName(sessao));
      arquivo.create({ overwrite: true });
      arquivo.write(toCsv(readings));

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sem compartilhamento', 'Este aparelho não oferece a folha de compartilhamento.');
        return;
      }
      await Sharing.shareAsync(arquivo.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar leituras',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (erro) {
      Alert.alert('Falha ao exportar', erro instanceof Error ? erro.message : 'Erro desconhecido.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <Image
          source={require('../../assets/images/wordmark.png')}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityLabel="OWL"
        />
        <Text style={styles.etiqueta}>MAGSCAN</Text>
        <View style={styles.espacador} />
        <Pressable onPress={() => router.replace('/')} accessibilityRole="link">
          <Text style={styles.atalho}>Início</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.identificacao}>
          <Text style={styles.titulo}>{sessao.name}</Text>
          <Text style={styles.subtitulo}>
            {formatarData(sessao.startedAt)} · base {formatar(baseline, 1)} µT · passada{' '}
            {formatar(sessao.strideLength, 2)} m
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>PERCURSO</Text>
          <RiskStrip levels={niveis} />
          <View style={styles.regua}>
            <Text style={styles.marca}>0 m</Text>
            <Text style={styles.marca}>{formatar(meio, 1)} m</Text>
            <Text style={styles.marca}>{formatar(stats.totalDistance, 1)} m</Text>
          </View>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>PROPORÇÃO DO PERCURSO</Text>
          <View style={styles.proporcao}>
            <Fatia fracao={stats.pctSafe} nivel="safe" />
            <Fatia fracao={stats.pctWarning} nivel="warning" />
            <Fatia fracao={stats.pctCritical} nivel="critical" />
          </View>
          <View style={styles.legenda}>
            <ItemLegenda nivel="safe" rotulo="limpo" fracao={stats.pctSafe} />
            <ItemLegenda nivel="warning" rotulo="atenção" fracao={stats.pctWarning} />
            <ItemLegenda nivel="critical" rotulo="crítico" fracao={stats.pctCritical} />
          </View>
        </View>

        <View style={styles.grade}>
          <StatCard rotulo="MÍNIMO" valor={formatar(stats.min, 1)} unidade="µT" />
          <StatCard rotulo="MÁXIMO" valor={formatar(stats.max, 1)} unidade="µT" />
          <StatCard rotulo="MÉDIA" valor={formatar(stats.mean, 1)} unidade="µT" />
        </View>
        <View style={styles.grade}>
          <StatCard rotulo="PASSOS" valor={String(stats.totalSteps)} />
          <StatCard rotulo="DISTÂNCIA" valor={formatar(stats.totalDistance, 1)} unidade="m" />
          <StatCard rotulo="LEITURAS" valor={String(readings.length)} />
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>MAIORES ANOMALIAS</Text>
          {anomalias.length === 0 ? (
            <Text style={styles.semAnomalia}>
              Nenhuma leitura saiu da faixa limpa neste percurso.
            </Text>
          ) : (
            <View style={styles.listaAnomalias}>
              {anomalias.map((a) => (
                <Anomalia key={a.index} leitura={a} baseline={baseline} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>RECOMENDAÇÃO</Text>
          <Text style={styles.recomendacao}>{recommendation(stats)}</Text>
        </View>

        <Pressable
          onPress={() => void exportar()}
          disabled={exportando}
          accessibilityRole="button"
          style={({ pressed }) => [styles.exportar, pressed && styles.exportarPressionado]}
        >
          <Text style={styles.exportarTexto}>
            {exportando ? 'Preparando...' : 'Exportar CSV'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fatia({ fracao, nivel }: { fracao: number; nivel: RiskLevel }) {
  if (fracao <= 0) return null;
  return <View style={{ flex: fracao, backgroundColor: COLORS[nivel] }} />;
}

function ItemLegenda({
  nivel,
  rotulo,
  fracao,
}: {
  nivel: RiskLevel;
  rotulo: string;
  fracao: number;
}) {
  return (
    <View style={styles.itemLegenda}>
      <View style={[styles.pastilha, { backgroundColor: COLORS[nivel] }]} />
      <Text style={styles.legendaTexto}>
        {formatar(fracao * 100, 0)}% {rotulo}
      </Text>
    </View>
  );
}

function Anomalia({ leitura, baseline }: { leitura: Reading; baseline: number }) {
  const sinal = leitura.magnitude < baseline ? '−' : '+';
  return (
    <View style={styles.anomalia}>
      <View style={[styles.pastilha, { backgroundColor: COLORS[leitura.level] }]} />
      <Text style={styles.anomaliaTexto}>
        aos {formatar(leitura.distance, 1)} m: {formatar(leitura.magnitude, 0)} µT, {sinal}
        {formatar(leitura.deviationPct * 100, 0)}%
      </Text>
    </View>
  );
}

// Vírgula decimal, como se escreve em português
function formatar(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

function formatarData(epochMs: number): string {
  const data = new Date(epochMs);
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} ${hora}`;
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingHorizontal: SPACING.lg,
  },
  telaVazia: {
    justifyContent: 'center',
    gap: SPACING.md,
  },
  vazioTitulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.title,
    letterSpacing: -0.8,
    color: THEME.fg,
  },
  vazioTexto: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.body,
    lineHeight: 24,
    color: THEME.muted,
  },
  botaoVazio: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: THEME.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 3,
  },
  botaoVazioTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.bg,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  wordmark: {
    width: 36,
    height: 22,
  },
  etiqueta: {
    fontFamily: FONTS.monoMedium,
    fontSize: TYPE.label,
    letterSpacing: 2.5,
    color: THEME.muted,
  },
  espacador: {
    flex: 1,
  },
  atalho: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.small,
    color: THEME.accent,
  },
  conteudo: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  identificacao: {
    gap: SPACING.xs,
  },
  titulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.title,
    letterSpacing: -0.8,
    color: THEME.fg,
  },
  subtitulo: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label,
    color: THEME.muted,
  },
  bloco: {
    gap: SPACING.sm,
  },
  secao: {
    fontFamily: FONTS.monoMedium,
    fontSize: TYPE.label,
    letterSpacing: 2.2,
    color: THEME.accent,
  },
  regua: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marca: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label,
    color: THEME.muted,
  },
  proporcao: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: THEME.surface,
  },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  pastilha: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendaTexto: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.small,
    color: THEME.muted,
  },
  grade: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  listaAnomalias: {
    gap: SPACING.sm,
  },
  anomalia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  anomaliaTexto: {
    fontFamily: FONTS.monoMedium,
    fontSize: TYPE.small,
    color: THEME.fg,
  },
  semAnomalia: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.body,
    color: THEME.muted,
  },
  recomendacao: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.body,
    lineHeight: 24,
    color: THEME.fg,
  },
  exportar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACING.md + 3,
    marginTop: SPACING.xs,
  },
  exportarPressionado: {
    opacity: 0.7,
  },
  exportarTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.fg,
  },
});
