// Tela de teste das T3 e T4: valida magnetômetro e pedômetro ao vivo no
// aparelho. É temporária — a Home definitiva (lista de sessões) chega na T8.
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_STRIDE_M, FONTS, STEP_THRESHOLD, THEME } from '../src/core/constants';
import { useMagnetometer } from '../src/hooks/useMagnetometer';
import { usePedometer } from '../src/hooks/usePedometer';

// Passada fixa por enquanto; a tela de calibração (T5) é que vai deixar editar.
const PASSADA_TESTE = DEFAULT_STRIDE_M;

// Limiares candidatos para aferir a detecção em campo. Sai junto com esta
// tela de teste, assim que o valor definitivo estiver escolhido.
const SONDAS = [1.12, 1.08, 1.04] as const;

export default function Home() {
  const mag = useMagnetometer();
  const passos = usePedometer(PASSADA_TESTE);

  // Mesmo sinal do acelerômetro contado com limiares mais baixos, lado a lado
  const sonda112 = usePedometer(PASSADA_TESTE, SONDAS[0]);
  const sonda108 = usePedometer(PASSADA_TESTE, SONDAS[1]);
  const sonda104 = usePedometer(PASSADA_TESTE, SONDAS[2]);

  const lendo = mag.isRunning || passos.isRunning;

  const iniciar = () => {
    mag.start();
    passos.start();
    sonda112.start();
    sonda108.start();
    sonda104.start();
  };
  const parar = () => {
    mag.stop();
    passos.stop();
    sonda112.stop();
    sonda108.stop();
    sonda104.stop();
  };
  const zerar = () => {
    mag.reset();
    passos.reset();
    sonda112.reset();
    sonda108.reset();
    sonda104.reset();
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

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bloco}>
          <Text style={styles.secao}>MAGNETÔMETRO</Text>
          {mag.isAvailable === false ? (
            <Text style={styles.indisponivel}>
              Este aparelho não tem magnetômetro. O app não consegue medir campo magnético aqui.
            </Text>
          ) : (
            <>
              <Medida
                valor={mag.smoothed === null ? '--' : formatar(mag.smoothed, 1)}
                unidade="µT"
              />
              <View style={styles.cartao}>
                <Linha rotulo="x" valor={mag.raw === null ? '--' : formatar(mag.raw.x, 2)} />
                <Linha rotulo="y" valor={mag.raw === null ? '--' : formatar(mag.raw.y, 2)} />
                <Linha rotulo="z" valor={mag.raw === null ? '--' : formatar(mag.raw.z, 2)} />
                <Linha rotulo="amostras" valor={String(mag.samples.length)} />
              </View>
            </>
          )}
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>PEDÔMETRO</Text>
          {passos.isAvailable === false ? (
            <Text style={styles.indisponivel}>
              Este aparelho não tem acelerômetro. Não dá para contar passos aqui.
            </Text>
          ) : (
            <>
              <Medida valor={String(passos.steps)} unidade="passos" />
              <View style={styles.cartao}>
                <Linha rotulo="distância" valor={`${formatar(passos.distance, 2)} m`} />
                <Linha rotulo="passada" valor={`${formatar(PASSADA_TESTE, 2)} m`} />
                <Linha rotulo="estado" valor={lendo ? 'lendo' : 'parado'} />
              </View>
            </>
          )}
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>AFERIÇÃO DO LIMIAR</Text>
          <View style={styles.cartao}>
            <Linha
              rotulo={`${formatar(STEP_THRESHOLD, 2)} g (atual)`}
              valor={String(passos.steps)}
            />
            <Linha rotulo={`${formatar(SONDAS[0], 2)} g`} valor={String(sonda112.steps)} />
            <Linha rotulo={`${formatar(SONDAS[1], 2)} g`} valor={String(sonda108.steps)} />
            <Linha rotulo={`${formatar(SONDAS[2], 2)} g`} valor={String(sonda104.steps)} />
          </View>
          <Text style={styles.dica}>
            Ande 20 passos devagar e 20 na velocidade normal. O limiar certo é o menor que acerta os
            dois. Este bloco é temporário e sai quando o valor estiver escolhido.
          </Text>
        </View>

        <Text style={styles.dica}>
          Encoste o aparelho numa tesoura, numa maçaneta ou na lateral de um armário de aço e anote
          os valores em µT.
        </Text>
      </ScrollView>

      <View style={styles.acoes}>
        {lendo ? (
          <Botao rotulo="Parar" variante="secundario" onPress={parar} />
        ) : (
          <Botao rotulo="Iniciar leitura" onPress={iniciar} />
        )}
        <Botao rotulo="Zerar" variante="secundario" onPress={zerar} />
      </View>
    </SafeAreaView>
  );
}

// Vírgula decimal, como se escreve em português
function formatar(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

function Medida({ valor, unidade }: { valor: string; unidade: string }) {
  return (
    <View style={styles.medida}>
      <Text style={styles.numero}>{valor}</Text>
      <Text style={styles.unidade}>{unidade}</Text>
    </View>
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
  conteudo: {
    paddingTop: 28,
    paddingBottom: 24,
    gap: 32,
  },
  bloco: {
    gap: 14,
  },
  secao: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 2.75,
    color: THEME.accent,
  },
  medida: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  numero: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 60,
    letterSpacing: -1.5,
    color: THEME.fg,
  },
  unidade: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: THEME.muted,
  },
  cartao: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
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
    paddingTop: 12,
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
