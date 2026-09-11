import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS, SPACING, THEME, TYPE } from '../src/core/constants';
import type { RiskLevel, Session } from '../src/core/types';
import { useMagnetometer } from '../src/hooks/useMagnetometer';
import { useSessions } from '../src/hooks/useSessions';

export default function Home() {
  const { sessions, isLoading, list, remove } = useSessions();
  // Só a checagem de disponibilidade roda aqui; o sensor não é iniciado
  const { isAvailable } = useMagnetometer();
  const semSensor = isAvailable === false;

  // A lista precisa recarregar ao voltar do resultado, senão a varredura
  // recém-finalizada não aparece.
  useFocusEffect(
    useCallback(() => {
      void list();
    }, [list])
  );

  const confirmarExclusao = (sessao: Session) => {
    Alert.alert('Apagar varredura', `"${sessao.name}" será removida deste aparelho.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => void remove(sessao.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <Image
          source={require('../assets/images/wordmark.png')}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityLabel="OWL"
        />
        <Text style={styles.etiqueta}>MAGSCAN</Text>
        <View style={styles.espacador} />
        <Pressable onPress={() => router.push('/sobre')} accessibilityRole="link">
          <Text style={styles.atalho}>Sobre</Text>
        </Pressable>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.topo}>
            <Text style={styles.titulo}>Varreduras</Text>
            {semSensor && (
              <View style={styles.aviso}>
                <Text style={styles.avisoTitulo}>Sem magnetômetro</Text>
                <Text style={styles.avisoTexto}>
                  Este aparelho não tem magnetômetro, então não é possível medir campo magnético
                  nem fazer uma varredura. As varreduras já salvas continuam abrindo normalmente.
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.vazio}>
              <Text style={styles.vazioTitulo}>Nenhuma varredura ainda</Text>
              <Text style={styles.vazioTexto}>
                Calibre num ponto limpo e caminhe pelo galpão para mapear onde há concentração
                metálica.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ItemSessao
            sessao={item}
            onAbrir={() => router.push({ pathname: '/resultado/[id]', params: { id: item.id } })}
            onApagar={() => confirmarExclusao(item)}
          />
        )}
      />

      <View style={styles.acoes}>
        <Pressable
          onPress={() => router.push('/calibrar')}
          disabled={semSensor}
          accessibilityRole="button"
          accessibilityState={{ disabled: semSensor }}
          style={({ pressed }) => [
            styles.botao,
            pressed && styles.botaoPressionado,
            semSensor && styles.botaoDesabilitado,
          ]}
        >
          <Text style={styles.botaoTexto}>Nova varredura</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ItemSessao({
  sessao,
  onAbrir,
  onApagar,
}: {
  sessao: Session;
  onAbrir: () => void;
  onApagar: () => void;
}) {
  const { stats } = sessao;

  return (
    <Pressable
      onPress={onAbrir}
      accessibilityRole="button"
      style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
    >
      <View style={styles.itemTopo}>
        <Text style={styles.itemNome} numberOfLines={1}>
          {sessao.name}
        </Text>
        <Pressable
          onPress={onApagar}
          accessibilityRole="button"
          accessibilityLabel={`Apagar ${sessao.name}`}
          hitSlop={12}
        >
          <Text style={styles.apagar}>apagar</Text>
        </Pressable>
      </View>

      <Text style={styles.itemMeta}>
        {formatarData(sessao.startedAt)} · {formatar(stats.totalDistance, 1)} m ·{' '}
        {stats.totalSteps} passos
      </Text>

      <View style={styles.proporcao}>
        <Fatia fracao={stats.pctSafe} nivel="safe" />
        <Fatia fracao={stats.pctWarning} nivel="warning" />
        <Fatia fracao={stats.pctCritical} nivel="critical" />
      </View>
    </Pressable>
  );
}

function Fatia({ fracao, nivel }: { fracao: number; nivel: RiskLevel }) {
  if (fracao <= 0) return null;
  return <View style={{ flex: fracao, backgroundColor: COLORS[nivel] }} />;
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
  lista: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  topo: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  titulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.title,
    letterSpacing: -0.8,
    color: THEME.fg,
  },
  aviso: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderLeftColor: COLORS.critical,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  avisoTitulo: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.fg,
  },
  avisoTexto: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.small,
    lineHeight: 21,
    color: THEME.muted,
  },
  vazio: {
    gap: SPACING.sm,
  },
  vazioTitulo: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.subtitle,
    color: THEME.fg,
  },
  vazioTexto: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.body,
    lineHeight: 24,
    color: THEME.muted,
  },
  item: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  itemPressionado: {
    opacity: 0.7,
  },
  itemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  itemNome: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.fg,
  },
  apagar: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label,
    color: THEME.muted,
  },
  itemMeta: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label,
    color: THEME.muted,
  },
  proporcao: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: THEME.bg,
  },
  acoes: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  botao: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: THEME.accent,
    paddingVertical: SPACING.md + 3,
  },
  botaoPressionado: {
    opacity: 0.8,
  },
  botaoDesabilitado: {
    opacity: 0.35,
  },
  botaoTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.bg,
  },
});
