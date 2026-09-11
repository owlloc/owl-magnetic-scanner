import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BASELINE_MAX_UT,
  BASELINE_MIN_UT,
  CALIBRATION_MS,
  DEFAULT_STRIDE_M,
  FONTS,
  THEME,
} from '../src/core/constants';
import { magnitude, median } from '../src/core/magnetics';
import { useMagnetometer } from '../src/hooks/useMagnetometer';

type Fase = 'ocioso' | 'calibrando' | 'pronto';

export default function Calibrar() {
  const mag = useMagnetometer();
  const [nome, setNome] = useState('');
  const [passadaTexto, setPassadaTexto] = useState(formatar(DEFAULT_STRIDE_M, 2));
  const [fase, setFase] = useState<Fase>('ocioso');
  const [progresso, setProgresso] = useState(0);
  const [baseline, setBaseline] = useState<number | null>(null);

  const passada = Number(passadaTexto.replace(',', '.'));
  const passadaValida = Number.isFinite(passada) && passada > 0;
  const baselineUtil = baseline !== null && baseline > 0;
  const foraDaFaixa =
    baselineUtil && (baseline < BASELINE_MIN_UT || baseline > BASELINE_MAX_UT);

  // Marca o tempo da coleta e move a barra de progresso
  useEffect(() => {
    if (fase !== 'calibrando') return;
    const inicio = Date.now();
    const id = setInterval(() => {
      const decorrido = Date.now() - inicio;
      setProgresso(Math.min(1, decorrido / CALIBRATION_MS));
      if (decorrido >= CALIBRATION_MS) setFase('pronto');
    }, 50);
    return () => clearInterval(id);
  }, [fase]);

  // Ao fechar a janela de coleta, o baseline é a mediana das magnitudes.
  // Depende só de `fase`: roda no render em que a coleta termina, com as
  // amostras daquele instante.
  useEffect(() => {
    if (fase !== 'pronto') return;
    mag.stop();
    setBaseline(median(mag.samples.map(magnitude)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const calibrar = () => {
    mag.reset();
    mag.start();
    setBaseline(null);
    setProgresso(0);
    setFase('calibrando');
  };

  const iniciarVarredura = () => {
    if (baseline === null || !passadaValida) return;
    const rotulo = nome.trim() === '' ? 'Sem nome' : nome.trim();
    router.push({
      pathname: '/varredura',
      params: { nome: rotulo, passada: String(passada), baseline: String(baseline) },
    });
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

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Calibração</Text>

        <View style={styles.campo}>
          <Text style={styles.rotuloCampo}>NOME DO LOCAL</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Galpão A - corredor 3"
            placeholderTextColor={THEME.muted}
            style={styles.entrada}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotuloCampo}>PASSADA (METROS)</Text>
          <TextInput
            value={passadaTexto}
            onChangeText={setPassadaTexto}
            keyboardType="decimal-pad"
            placeholder={formatar(DEFAULT_STRIDE_M, 2)}
            placeholderTextColor={THEME.muted}
            style={[styles.entrada, !passadaValida && styles.entradaInvalida]}
          />
          {!passadaValida && (
            <Text style={styles.erro}>Informe um número maior que zero, por exemplo 0,70.</Text>
          )}
        </View>

        {mag.isAvailable === false ? (
          <Text style={styles.indisponivel}>
            Este aparelho não tem magnetômetro. Não é possível calibrar nem fazer a varredura aqui.
          </Text>
        ) : (
          <>
            <Text style={styles.instrucao}>
              Fique parado, longe de estruturas metálicas. A medição leva{' '}
              {Math.round(CALIBRATION_MS / 1000)} segundos.
            </Text>

            {fase === 'calibrando' && (
              <View style={styles.bloco}>
                <View style={styles.barraFundo}>
                  <View style={[styles.barraPreenchida, { width: `${progresso * 100}%` }]} />
                </View>
                <View style={styles.linhaMedicao}>
                  <Text style={styles.medindo}>medindo</Text>
                  <Text style={styles.aoVivo}>
                    {mag.smoothed === null ? '--' : formatar(mag.smoothed, 1)} µT
                  </Text>
                </View>
              </View>
            )}

            {fase === 'pronto' && baseline !== null && (
              <View style={styles.bloco}>
                <Text style={styles.rotuloCampo}>BASELINE MEDIDO</Text>
                <View style={styles.medida}>
                  <Text style={styles.numero}>{formatar(baseline, 1)}</Text>
                  <Text style={styles.unidade}>µT</Text>
                </View>
                <Text style={styles.amostras}>mediana de {mag.samples.length} amostras</Text>

                {foraDaFaixa && (
                  <View style={styles.aviso}>
                    <Text style={styles.avisoTitulo}>Leitura fora do esperado</Text>
                    <Text style={styles.avisoTexto}>
                      O campo terrestre medido por celular costuma ficar entre {BASELINE_MIN_UT} e{' '}
                      {BASELINE_MAX_UT} µT. Este valor indica metal por perto ou magnetômetro
                      descalibrado. Afaste-se de estruturas metálicas, mova o aparelho em forma de
                      oito no ar e calibre de novo.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.acoes}>
        {fase === 'pronto' ? (
          <>
            <Botao rotulo="Calibrar de novo" variante="secundario" onPress={calibrar} />
            <Botao
              rotulo="Iniciar varredura"
              onPress={iniciarVarredura}
              desabilitado={!baselineUtil || !passadaValida}
            />
          </>
        ) : (
          <Botao
            rotulo={fase === 'calibrando' ? 'Medindo...' : 'Calibrar'}
            onPress={calibrar}
            desabilitado={fase === 'calibrando' || mag.isAvailable === false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Vírgula decimal, como se escreve em português
function formatar(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

function Botao({
  rotulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
}: {
  rotulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  desabilitado?: boolean;
}) {
  const primario = variante === 'primario';
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      style={({ pressed }) => [
        styles.botao,
        primario ? styles.botaoPrimario : styles.botaoSecundario,
        pressed && styles.botaoPressionado,
        desabilitado && styles.botaoDesabilitado,
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
    gap: 24,
  },
  titulo: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 30,
    letterSpacing: -0.8,
    color: THEME.fg,
  },
  campo: {
    gap: 8,
  },
  rotuloCampo: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: THEME.accent,
  },
  entrada: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: THEME.fg,
  },
  entradaInvalida: {
    borderColor: THEME.muted,
  },
  erro: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: THEME.muted,
  },
  instrucao: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 23,
    color: THEME.muted,
  },
  bloco: {
    gap: 12,
  },
  barraFundo: {
    height: 6,
    borderRadius: 999,
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: '100%',
    backgroundColor: THEME.accent,
  },
  linhaMedicao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  medindo: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: THEME.muted,
  },
  aoVivo: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: THEME.fg,
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
  amostras: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: THEME.muted,
  },
  aviso: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderLeftColor: THEME.accent,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  avisoTitulo: {
    fontFamily: FONTS.sansMedium,
    fontSize: 15,
    color: THEME.fg,
  },
  avisoTexto: {
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
  botaoDesabilitado: {
    opacity: 0.4,
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
