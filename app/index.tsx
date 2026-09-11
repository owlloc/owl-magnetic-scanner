import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS, THEME } from '../src/core/constants';
import type { RiskLevel, Session } from '../src/core/types';
import { useSessions } from '../src/hooks/useSessions';

export default function Home() {
  const { sessions, isLoading, list, remove } = useSessions();

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
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.titulo}>Varreduras</Text>}
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
          accessibilityRole="button"
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
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
    paddingHorizontal: 24,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
  },
  wordmark: {
    width: 36,
    height: 22,
  },
  etiqueta: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 2.5,
    color: THEME.muted,
  },
  lista: {
    paddingTop: 24,
    paddingBottom: 24,
    gap: 12,
  },
  titulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 30,
    letterSpacing: -0.8,
    color: THEME.fg,
    paddingBottom: 12,
  },
  vazio: {
    gap: 8,
    paddingTop: 8,
  },
  vazioTitulo: {
    fontFamily: FONTS.sansMedium,
    fontSize: 17,
    color: THEME.fg,
  },
  vazioTexto: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 23,
    color: THEME.muted,
  },
  item: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  itemPressionado: {
    opacity: 0.7,
  },
  itemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemNome: {
    flex: 1,
    fontFamily: FONTS.sansMedium,
    fontSize: 17,
    color: THEME.fg,
  },
  apagar: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: THEME.muted,
  },
  itemMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  botao: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: THEME.accent,
    paddingVertical: 15,
  },
  botaoPressionado: {
    opacity: 0.8,
  },
  botaoTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: 16,
    color: THEME.bg,
  },
});
