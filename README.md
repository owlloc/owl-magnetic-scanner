# OWL MagScan

Ferramenta de campo para mapear concentração de massa ferromagnética num galpão
antes da instalação do RTLS OWL, usando o magnetômetro, o acelerômetro e o motor
de vibração do celular. App offline, sem backend.

A especificação completa está em [`OWL-MagScan-SPEC.md`](./OWL-MagScan-SPEC.md).

## Rodar

```bash
npm install
npx expo start
```

Abrir no Expo Go lendo o QR code.

## Estrutura

```
app/    telas (expo-router, roteamento por arquivo)
src/
  core/        funções puras: cálculo, classificação, estatística
  hooks/       acesso aos sensores e persistência
  components/  componentes de UI
```
