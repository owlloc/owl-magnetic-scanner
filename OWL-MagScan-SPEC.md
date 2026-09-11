# OWL MagScan — Especificação Técnica

**Documento de trabalho para execução assistida com Claude Code.**
Leia o documento inteiro antes de escrever qualquer linha de código. Execute **uma task por vez**, na ordem, e pare ao final de cada uma para validação humana.

---

## 1. Contexto

O OWL é um sistema RTLS (Real-Time Location System) que localiza ativos em ambientes indoor por radiofrequência de banda larga, medindo tempo de voo de pulsos entre uma tag e três ou mais âncoras fixas. A precisão depende de linha de visada limpa entre tag e âncora. Estruturas metálicas (vigas, portas de aço, estantes industriais, painéis elétricos) causam reflexão e multipath, que é a principal fonte de erro do sistema.

Esse app **não se conecta ao OWL**. Ele é uma ferramenta de campo independente, usada **antes** da instalação, para identificar visualmente onde há concentração de massa metálica num galpão. Como massa ferromagnética distorce o campo magnético terrestre, o magnetômetro do celular funciona como detector indireto de zonas de risco de multipath.

O resultado é um mapa em faixa colorida do percurso caminhado, indicando onde não vale a pena posicionar uma âncora.

### Requisito acadêmico

O trabalho exige **dois ou mais recursos nativos do dispositivo**. Este app usa três:

| Recurso nativo | Função no app | Biblioteca |
|---|---|---|
| Magnetômetro | Mede a intensidade do campo magnético em µT | `expo-sensors` |
| Acelerômetro | Conta passos para posicionar cada leitura ao longo do percurso | `expo-sensors` |
| Motor de vibração (háptico) | Alerta o operador ao entrar numa zona crítica | `expo-haptics` |

---

## 2. Stack e restrições

- **Expo** (última versão estável) com **TypeScript**, template `expo-router`
- **React Native**, rodando no celular físico via **Expo Go**
- Sem backend, sem API, sem banco remoto. Tudo offline.
- Persistência local com `@react-native-async-storage/async-storage`
- Exportação com `expo-file-system` + `expo-sharing`
- **Não instalar bibliotecas além das listadas nas tasks.** Se achar que uma nova dependência é necessária, pare e pergunte antes.
- Gráficos desenhados com `View` e flex. Nada de biblioteca de charts.

### Aviso sobre APIs que mudaram

A API do `expo-file-system` mudou entre versões recentes do SDK (o import antigo passou a viver em `expo-file-system/legacy`). Antes de escrever a task de exportação, verifique a versão instalada no `package.json` e consulte a documentação correspondente. Não assuma a assinatura de memória.

---

## 3. Regras de trabalho para o Claude Code

1. Execute **uma task por vez**. Ao terminar, mostre o diff, liste o que testar no celular e **aguarde confirmação** antes de seguir.
2. Não antecipe tasks futuras. Não crie arquivos que pertencem a uma task posterior.
3. TypeScript em modo estrito. Sem `any`.
4. Lógica de cálculo em funções **puras**, isoladas da UI, em `src/core/`. Nada de matemática dentro de componente.
5. Toda constante numérica (limiares, intervalos, passada padrão) vive em `src/core/constants.ts`, nunca hardcoded no meio do código.
6. Comentários em português, curtos, só onde a intenção não é óbvia pelo nome.
7. Se um requisito deste documento estiver ambíguo ou fisicamente incorreto, **diga isso em vez de inventar**.

---

## 4. Modelo de domínio

```ts
// Uma amostra bruta do magnetômetro
type MagSample = {
  x: number;        // µT
  y: number;        // µT
  z: number;        // µT
  timestamp: number; // ms (Date.now())
};

// Uma leitura processada, já posicionada no percurso
type Reading = {
  index: number;
  timestamp: number;
  magnitude: number;      // µT, módulo do vetor
  deviationPct: number;   // desvio percentual em relação ao baseline
  level: RiskLevel;
  steps: number;          // passos acumulados até essa leitura
  distance: number;       // metros acumulados
};

type RiskLevel = 'safe' | 'warning' | 'critical';

type Session = {
  id: string;             // timestamp em string
  name: string;           // informado pelo usuário, ex.: "Galpão A - corredor 3"
  startedAt: number;
  finishedAt: number;
  baseline: number;       // µT de referência
  strideLength: number;   // metros por passo usados nesta sessão
  readings: Reading[];
  stats: SessionStats;
};

type SessionStats = {
  min: number;
  max: number;
  mean: number;
  totalSteps: number;
  totalDistance: number;
  pctSafe: number;
  pctWarning: number;
  pctCritical: number;
};
```

---

## 5. Física e algoritmos

### 5.1 Magnitude do campo

```
B = sqrt(x² + y² + z²)
```

O campo magnético terrestre no Brasil fica entre aproximadamente 22 e 25 µT de componente horizontal, com módulo total na faixa de 22 a 45 µT dependendo da latitude. Leituras muito fora de 20–70 µT em ambiente limpo indicam sensor descalibrado ou interferência local.

### 5.2 Suavização

Média móvel simples de janela 5 sobre a magnitude. O magnetômetro é ruidoso e sem isso a faixa colorida fica piscando.

### 5.3 Baseline

Calibração de 3 segundos parado, em ponto afastado de metal. O baseline `B0` é a **mediana** das amostras coletadas (mediana e não média, para não ser puxada por um outlier).

### 5.4 Classificação de risco

```
desvio = |B - B0| / B0
```

| Faixa | Condição | Cor |
|---|---|---|
| `safe` | desvio < 0.15 | verde |
| `warning` | 0.15 ≤ desvio < 0.40 | amarelo |
| `critical` | desvio ≥ 0.40 | vermelho |

Esses limiares são heurísticos e devem estar em `constants.ts` para serem ajustados durante os testes de campo.

### 5.5 Detecção de passo

Usando o acelerômetro (valores em unidades de g, com módulo ≈ 1.0 em repouso):

```
a = sqrt(ax² + ay² + az²)
```

Um passo é contado quando `a` cruza `STEP_THRESHOLD = 1.18` de baixo para cima **e** já passaram `STEP_REFRACTORY_MS = 280` ms desde o último passo contado. O período refratário evita contagem dupla no mesmo impacto.

```
distância = passos × strideLength
```

`strideLength` padrão é 0.70 m, editável na tela de calibração.

### 5.6 Frequências de amostragem

- Magnetômetro: `setUpdateInterval(100)` → 10 Hz
- Acelerômetro: `setUpdateInterval(50)` → 20 Hz, precisa ser mais rápido para pegar o pico do passo

### 5.7 Limitações a documentar no app e no vídeo

Escreva isso na tela "Sobre" e mencione na apresentação, porque é o que separa um trabalho honesto de um que finge precisão que não tem:

- O magnetômetro detecta **material ferromagnético**, não alumínio nem cobre. Uma estrutura de alumínio causa multipath em RF mas não aparece aqui.
- A detecção é **indireta**. Correlação com degradação de RF é fisicamente plausível, não medida.
- A distância por pedômetro tem erro típico de 5 a 10%.
- A orientação do celular altera a leitura de cada eixo, mas o **módulo** do vetor é aproximadamente invariante à rotação, e é por isso que usamos o módulo e não os eixos separados.

---

## 6. Estrutura de arquivos

```
app/
  _layout.tsx           // stack do expo-router
  index.tsx             // Home: lista de sessões
  calibrar.tsx          // Tela de calibração
  varredura.tsx         // Tela de varredura ao vivo
  resultado/[id].tsx    // Tela de resultado
  sobre.tsx             // Metodologia e limitações
src/
  core/
    constants.ts        // limiares, intervalos, passada padrão, cores
    types.ts            // tipos do domínio
    magnetics.ts        // magnitude, mediana, média móvel, classificação
    steps.ts            // detector de passo
    stats.ts            // cálculo de SessionStats
    csv.ts              // serialização para CSV
  hooks/
    useMagnetometer.ts
    usePedometer.ts
    useSessions.ts      // persistência
  components/
    RiskStrip.tsx       // faixa colorida do percurso
    LiveGauge.tsx       // número grande + cor de fundo
    StatCard.tsx
```

---

## 7. Tasks

Cada task é um commit. Não pule, não junte.

---

### T0 — Setup do projeto

**Objetivo:** projeto Expo rodando no celular com tela em branco.

**Passos:**
1. `npx create-expo-app@latest owl-magscan --template` → escolher o template com TypeScript e expo-router
2. `npx expo install expo-sensors expo-haptics`
3. Limpar o boilerplate: apagar as telas de exemplo, deixar só `app/_layout.tsx` e `app/index.tsx` com um `<Text>OWL MagScan</Text>`
4. Criar `src/core/`, `src/hooks/`, `src/components/` vazios

**Critério de aceite:** `npx expo start` abre, o app carrega no Expo Go do celular e mostra o título.

**Teste no celular:** abrir e ver o texto.

---

### T1 — Tipos e constantes

**Objetivo:** domínio tipado, sem UI.

**Entregável:** `src/core/types.ts` e `src/core/constants.ts` exatamente com os tipos da seção 4 e com:

```ts
export const MAG_UPDATE_MS = 100;
export const ACC_UPDATE_MS = 50;
export const SMOOTHING_WINDOW = 5;
export const CALIBRATION_MS = 3000;
export const WARNING_THRESHOLD = 0.15;
export const CRITICAL_THRESHOLD = 0.40;
export const STEP_THRESHOLD = 1.18;
export const STEP_REFRACTORY_MS = 280;
export const DEFAULT_STRIDE_M = 0.70;
export const COLORS = { safe: '#16a34a', warning: '#eab308', critical: '#dc2626' };
```

**Critério de aceite:** `npx tsc --noEmit` passa limpo.

---

### T2 — Núcleo de cálculo (funções puras)

**Objetivo:** toda a matemática pronta e testável antes de qualquer sensor.

**Entregável:** `src/core/magnetics.ts`, `src/core/steps.ts`, `src/core/stats.ts` com:

- `magnitude(s: {x,y,z}): number`
- `median(values: number[]): number`
- `movingAverage(values: number[], window: number): number[]`
- `deviation(value: number, baseline: number): number`
- `classify(deviationPct: number): RiskLevel`
- `createStepDetector(): { push(a: number, t: number): boolean }` → retorna `true` quando um passo é confirmado. Detector com estado encapsulado em closure, sem variável global.
- `computeStats(readings: Reading[]): SessionStats`

**Critério de aceite:** o Claude Code deve escrever um arquivo temporário `scratch.ts` e rodar `npx tsx scratch.ts` (ou `node` com ts-node) provando, no terminal:
- `magnitude({x:3,y:4,z:0}) === 5`
- `median([1,2,100]) === 2`
- `classify(0.5) === 'critical'`, `classify(0.2) === 'warning'`, `classify(0.05) === 'safe'`
- um array simulado de acelerômetro com 10 picos produz exatamente 10 passos

Depois apagar o `scratch.ts`.

---

### T3 — Hook do magnetômetro

**Objetivo:** ler o sensor de verdade.

**Entregável:** `src/hooks/useMagnetometer.ts` que:
- verifica `Magnetometer.isAvailableAsync()` e expõe `isAvailable`
- inscreve no listener com `MAG_UPDATE_MS`
- expõe `{ isAvailable, raw, smoothed, samples, start, stop, reset }`
- **remove o listener no cleanup do `useEffect`**. Vazamento de listener aqui trava o app depois de algumas navegações.

**Critério de aceite:** uma tela de teste temporária mostrando o valor ao vivo. Ao aproximar o celular de qualquer objeto metálico o número deve subir visivelmente.

**Teste no celular:** encostar o celular numa tesoura, numa maçaneta, na lateral de um armário de aço. Anote os valores, você vai precisar deles para ajustar os limiares.

---

### T4 — Hook do pedômetro

**Objetivo:** contar passos com o acelerômetro.

**Entregável:** `src/hooks/usePedometer.ts` usando o `createStepDetector` da T2, expondo `{ steps, distance, start, stop, reset }` e recebendo `strideLength` como parâmetro.

**Importante:** usar o `Accelerometer` do `expo-sensors`, **não** o `expo-pedometer`. O requisito acadêmico é usar o sensor bruto, e implementar a detecção você mesmo é exatamente o que dá valor ao trabalho.

**Critério de aceite:** tela de teste temporária com o contador. Andar 20 passos contados de cabeça e conferir a diferença. Erro aceitável: ±2.

---

### T5 — Tela de calibração

**Objetivo:** estabelecer o baseline.

**Comportamento:**
1. Campo de texto para o nome do local
2. Campo numérico para a passada, pré-preenchido com `DEFAULT_STRIDE_M`
3. Instrução: "Fique parado, longe de estruturas metálicas"
4. Botão "Calibrar" inicia contagem de 3 s com barra de progresso
5. Ao terminar, mostra o `B0` calculado e um aviso se ficar fora de 20–70 µT
6. Botão "Iniciar varredura" navega para `/varredura` passando nome, passada e baseline

**Critério de aceite:** calibrar no meio de um cômodo dá um valor plausível; calibrar encostado na geladeira dispara o aviso.

---

### T6 — Tela de varredura ao vivo

**Objetivo:** o coração do app.

**Comportamento:**
- Fundo da tela muda de cor conforme o `RiskLevel` atual
- Número grande em µT no centro, desvio percentual abaixo
- Contador de passos e distância
- Faixa colorida crescendo em tempo real na parte de baixo (usa `RiskStrip`, criado aqui em versão simples)
- **Háptico:** `Haptics.notificationAsync(Warning)` ao entrar em `warning`, `Haptics.notificationAsync(Error)` ao entrar em `critical`. Disparar **só na transição de nível**, nunca a cada leitura, senão o celular vibra sem parar.
- Botão "Finalizar" para a captura e navega para o resultado
- Manter a tela acesa durante a varredura

**Critério de aceite:** caminhar pela casa passando perto da geladeira e do fogão produz uma faixa com verde no meio dos cômodos e vermelho perto dos eletrodomésticos, com vibração nas transições.

---

### T7 — Tela de resultado

**Objetivo:** o entregável visual do trabalho.

**Comportamento:**
- Faixa colorida completa do percurso, com régua de distância embaixo
- Cards de estatística: mín, máx, média, passos, distância total
- Barra de proporção: % do percurso em cada faixa de risco
- Lista das 3 maiores anomalias, cada uma com a distância em metros ("aos 12,4 m: 96 µT, +112%")
- Recomendação textual gerada por regra simples, por exemplo: se `pctCritical > 30%`, "Ambiente com alta densidade metálica. Recomenda-se aumentar a densidade de âncoras ou reposicionar fora das zonas críticas."

**Critério de aceite:** a tela inteira cabe em um print e é compreensível sem explicação.

---

### T8 — Persistência local

**Objetivo:** sessões sobrevivem ao fechar o app.

`npx expo install @react-native-async-storage/async-storage`

**Entregável:** `src/hooks/useSessions.ts` com `list`, `save`, `get`, `remove`. Chave `@owl_magscan_sessions`, valor um array serializado em JSON. A Home passa a listar as sessões salvas, cada item abrindo `/resultado/[id]`.

**Critério de aceite:** fechar o app completamente, reabrir, a sessão continua lá.

---

### T9 — Exportação CSV

**Objetivo:** dado bruto sai do celular.

`npx expo install expo-file-system expo-sharing`

**Entregável:** `src/core/csv.ts` gerando cabeçalho `index,timestamp,steps,distance_m,magnitude_uT,deviation_pct,level` e botão "Exportar CSV" no resultado, que grava no diretório de cache e abre a folha de compartilhamento.

**Antes de escrever:** confira a versão do `expo-file-system` instalada e use a API correta daquela versão.

**Critério de aceite:** o arquivo chega no WhatsApp ou e-mail e abre no Excel com as colunas separadas.

---

### T10 — Tela "Sobre" e polimento

**Objetivo:** fechar o trabalho.

- Tela `sobre.tsx` com o contexto do OWL, os três recursos nativos usados e **a lista de limitações da seção 5.7 escrita por extenso**
- Revisão visual: espaçamento consistente, tipografia em duas ou três escalas só, estados vazios tratados
- Tratar o caso de o dispositivo não ter magnetômetro com uma mensagem clara

---

## 8. Ordem mínima para entregar hoje

Se o tempo apertar, o MVP defensável é **T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7**. As tasks T8, T9 e T10 são incremento. Um app que mede, classifica, vibra e mostra o resultado já cumpre o requisito de dois ou mais recursos nativos com folga.

---

## 9. Roteiro do vídeo para o professor

Grave a tela do celular junto com uma filmagem do ambiente, ou narre enquanto caminha.

1. **Abrir e explicar o problema em 20 segundos.** O OWL localiza ativos por RF; metal causa multipath; esse app mapeia onde tem metal.
2. **Nomear os recursos nativos na tela.** Magnetômetro, acelerômetro, motor de vibração. O professor precisa ouvir isso explicitamente.
3. **Calibrar no meio de um cômodo vazio.** Mostrar o baseline.
4. **Caminhar em linha reta passando ao lado de uma geladeira ou de um armário de aço.** Esse é o momento do vídeo: a tela vira vermelha e o celular vibra. Filme isso de perto.
5. **Continuar até um trecho limpo** para a tela voltar ao verde e provar que não é ruído aleatório.
6. **Finalizar e mostrar o resultado**, apontando a faixa colorida e a correspondência com o trajeto real.
7. **Ler as limitações.** Dizer o que o app não detecta é o que demonstra domínio do assunto, e é o que a maior parte dos trabalhos não faz.

---

## 10. Prompt de abertura para o Claude Code

Cole isso na primeira mensagem, junto com este arquivo:

> Leia o arquivo `OWL-MagScan-SPEC.md` por inteiro. Confirme que entendeu a arquitetura e as regras de trabalho da seção 3. Em seguida execute **apenas a T0** e pare para eu validar no celular. Não avance para a T1 sem minha confirmação.
