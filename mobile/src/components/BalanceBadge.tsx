import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  balanceUsdDisplay: string;
  loading?: boolean;
}

export function BalanceBadge({ balanceUsdDisplay, loading }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saldo</Text>
      <Text style={styles.amount}>{loading ? '—' : balanceUsdDisplay}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.balanceBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.balanceText,
    fontWeight: '600',
  },
  amount: {
    ...Typography.body,
    color: Colors.balanceText,
    fontWeight: '700',
  },
});
