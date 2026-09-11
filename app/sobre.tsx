import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BASELINE_MAX_UT,
  BASELINE_MIN_UT,
  CRITICAL_THRESHOLD,
  FONTS,
  SPACING,
  THEME,
  TYPE,
  WARNING_THRESHOLD,
} from '../src/core/constants';

const RECURSOS = [
  {
    nome: 'Magnetômetro',
    papel: 'Mede a intensidade do campo magnético em µT, a 10 Hz. É o sensor que detecta a massa metálica.',
  },
  {
    nome: 'Acelerômetro',
    papel: 'Amostrado a 20 Hz. A contagem de passos é feita pelo app a partir do sinal bruto, e é ela que posiciona cada leitura ao longo do percurso.',
  },
  {
    nome: 'Motor de vibração',
    papel: 'Alerta o operador na transição para uma zona de atenção ou crítica, sem precisar olhar a tela.',
  },
] as const;

const LIMITACOES = [
  'O magnetômetro detecta material ferromagnético, não alumínio nem cobre. Uma estrutura de alumínio causa multipath em RF, mas não aparece aqui.',
  'A detecção é indireta. A correlação entre distorção magnética e degradação de RF é fisicamente plausível, mas não é medida por este app.',
  'A distância vem de um pedômetro e tem erro típico de 5 a 10%. Em caminhada muito lenta o erro é maior, porque o impacto do pé fica fraco demais para cruzar o limiar de detecção.',
  'A orientação do celular altera a leitura de cada eixo, mas o módulo do vetor é aproximadamente invariante à rotação. É por isso que o app usa o módulo, e não os eixos separados.',
] as const;

export default function Sobre() {
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
        <Pressable onPress={() => router.back()} accessibilityRole="link">
          <Text style={styles.atalho}>Voltar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Sobre</Text>

        <View style={styles.bloco}>
          <Text style={styles.secao}>O PROBLEMA</Text>
          <Text style={styles.paragrafo}>
            O OWL é um sistema RTLS que localiza ativos em ambiente indoor por radiofrequência de
            banda larga, medindo o tempo de voo de pulsos entre uma tag e três ou mais âncoras
            fixas. A precisão depende de linha de visada limpa. Estruturas metálicas — vigas,
            portas de aço, estantes industriais, painéis elétricos — causam reflexão e multipath,
            que é a principal fonte de erro do sistema.
          </Text>
          <Text style={styles.paragrafo}>
            Este app não se conecta ao OWL. É uma ferramenta de campo independente, usada antes da
            instalação. Como massa ferromagnética distorce o campo magnético terrestre, o
            magnetômetro do celular funciona como detector indireto de zonas de risco de multipath.
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>RECURSOS NATIVOS UTILIZADOS</Text>
          {RECURSOS.map((r) => (
            <View key={r.nome} style={styles.item}>
              <Text style={styles.itemTitulo}>{r.nome}</Text>
              <Text style={styles.paragrafo}>{r.papel}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>COMO O RISCO É CALCULADO</Text>
          <Text style={styles.paragrafo}>
            A calibração mede o campo parado por 3 segundos e toma a mediana das amostras como
            baseline B0 — mediana, e não média, para um único valor fora da curva não deslocar a
            referência. Um baseline fora de {BASELINE_MIN_UT} a {BASELINE_MAX_UT} µT dispara aviso.
          </Text>
          <Text style={styles.paragrafo}>
            Durante a varredura, o módulo do vetor B passa por uma média móvel e é comparado ao
            baseline: desvio = |B − B0| / B0. Abaixo de {pct(WARNING_THRESHOLD)}% o trecho é limpo,
            entre {pct(WARNING_THRESHOLD)}% e {pct(CRITICAL_THRESHOLD)}% é atenção, e de{' '}
            {pct(CRITICAL_THRESHOLD)}% para cima é crítico. Esses limiares são heurísticos e foram
            escolhidos para ajuste em campo.
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.secao}>LIMITAÇÕES</Text>
          {LIMITACOES.map((texto) => (
            <View key={texto} style={styles.limitacao}>
              <View style={styles.marcador} />
              <Text style={styles.paragrafo}>{texto}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function pct(fracao: number): string {
  return String(Math.round(fracao * 100));
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
  conteudo: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },
  titulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.title,
    letterSpacing: -0.8,
    color: THEME.fg,
  },
  bloco: {
    gap: SPACING.md,
  },
  secao: {
    fontFamily: FONTS.monoMedium,
    fontSize: TYPE.label,
    letterSpacing: 2.2,
    color: THEME.accent,
  },
  paragrafo: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.body,
    lineHeight: 24,
    color: THEME.muted,
  },
  item: {
    gap: SPACING.xs,
  },
  itemTitulo: {
    fontFamily: FONTS.sansMedium,
    fontSize: TYPE.body,
    color: THEME.fg,
  },
  limitacao: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  marcador: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: THEME.accent,
    marginTop: 10,
  },
});
