// Tela de teste da T3: valida o magnetômetro ao vivo no aparelho.
// É temporária — a Home definitiva (lista de sessões) chega na T8.
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONTS, THEME } from '../src/core/constants';
import { useMagnetometer } from '../src/hooks/useMagnetometer';

export default function Home() {
  const mag = useMagnetometer();

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

      <View style={styles.corpo}>
        <Text style={styles.secao}>TESTE DO MAGNETÔMETRO</Text>

        {mag.isAvailable === false ? (
          <Text style={styles.indisponivel}>
            Este aparelho não tem magnetômetro. O app não consegue medir campo magnético aqui.
          </Text>
        ) : (
          <>
            <View style={styles.leitura}>
              <Text style={styles.numero}>
                {mag.smoothed === null ? '--' : mag.smoothed.toFixed(1)}
              </Text>
              <Text style={styles.unidade}>µT</Text>
            </View>

            <View style={styles.cartao}>
              <Linha rotulo="x" valor={mag.raw === null ? '--' : mag.raw.x.toFixed(2)} />
              <Linha rotulo="y" valor={mag.raw === null ? '--' : mag.raw.y.toFixed(2)} />
              <Linha rotulo="z" valor={mag.raw === null ? '--' : mag.raw.z.toFixed(2)} />
              <Linha rotulo="amostras" valor={String(mag.samples.length)} />
              <Linha rotulo="estado" valor={mag.isRunning ? 'lendo' : 'parado'} />
            </View>

            <Text style={styles.dica}>
              Encoste o aparelho numa tesoura, numa maçaneta ou na lateral de um armário de aço e
              anote os valores.
            </Text>
          </>
        )}
      </View>

      <View style={styles.acoes}>
        {mag.isRunning ? (
          <Botao rotulo="Parar" variante="secundario" onPress={mag.stop} />
        ) : (
          <Botao rotulo="Iniciar leitura" onPress={mag.start} />
        )}
        <Botao rotulo="Zerar" variante="secundario" onPress={mag.reset} />
      </View>
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

function Botao({
  rotulo,
  onPress,
  variante = 'primario',
}: {
  rotulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
}) {
  const primario = variante === 'primario';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.botao,
        primario ? styles.botaoPrimario : styles.botaoSecundario,
        pressed && styles.botaoPressionado,
      ]}
    >
      <Text style={[styles.botaoTexto, primario ? styles.botaoTextoPrimario : undefined]}>
        {rotulo}
      </Text>
    </Pressable>
  );
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
  corpo: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  secao: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 2.75,
    color: THEME.accent,
  },
  leitura: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  numero: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 76,
    letterSpacing: -2,
    color: THEME.fg,
  },
  unidade: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    color: THEME.muted,
  },
  cartao: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linhaRotulo: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: THEME.muted,
  },
  linhaValor: {
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: THEME.fg,
  },
  dica: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 21,
    color: THEME.muted,
  },
  indisponivel: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    lineHeight: 24,
    color: THEME.fg,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  botao: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 14,
  },
  botaoPrimario: {
    backgroundColor: THEME.accent,
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  botaoPressionado: {
    opacity: 0.8,
  },
  botaoTexto: {
    fontFamily: FONTS.sansMedium,
    fontSize: 15,
    color: THEME.fg,
  },
  botaoTextoPrimario: {
    color: THEME.bg,
  },
});
