import { StyleSheet, View } from 'react-native';

import { COLORS, SPACING } from '../core/constants';
import { summarizeStrip } from '../core/stats';
import type { RiskLevel } from '../core/types';

export function RiskStrip({ levels }: { levels: RiskLevel[] }) {
  const blocos = summarizeStrip(levels);

  return (
    <View style={styles.faixa}>
      {blocos.map((nivel, i) => (
        <View key={i} style={[styles.bloco, { backgroundColor: COLORS[nivel] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    height: SPACING.xxl + 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  bloco: {
    flex: 1,
    height: '100%',
  },
});
