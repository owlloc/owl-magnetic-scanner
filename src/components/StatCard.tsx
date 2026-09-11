import { StyleSheet, Text, View } from 'react-native';

import { FONTS, SPACING, THEME, TYPE } from '../core/constants';

export function StatCard({
  rotulo,
  valor,
  unidade,
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
}) {
  return (
    <View style={styles.cartao}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View style={styles.linha}>
        <Text style={styles.valor}>{valor}</Text>
        {unidade !== undefined && <Text style={styles.unidade}>{unidade}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  rotulo: {
    fontFamily: FONTS.mono,
    fontSize: TYPE.label - 2,
    letterSpacing: 1.4,
    color: THEME.muted,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  valor: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: TYPE.subtitle,
    letterSpacing: -0.5,
    color: THEME.fg,
  },
  unidade: {
    fontFamily: FONTS.sans,
    fontSize: TYPE.label,
    color: THEME.muted,
  },
});
