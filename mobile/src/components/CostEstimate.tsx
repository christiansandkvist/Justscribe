import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { PricingConfig } from '../types';
import { estimateCost, formatDuration } from '../constants/pricing';

interface Props {
  durationSeconds: number;
  pricing: PricingConfig;
  currentBalance: number;
}

export function CostEstimate({ durationSeconds, pricing, currentBalance }: Props) {
  const estimate = estimateCost(durationSeconds, pricing);
  const hasEnough = currentBalance >= estimate.credits;

  return (
    <View style={[styles.container, !hasEnough && styles.insufficient]}>
      <View style={styles.row}>
        <Text style={styles.label}>Fillängd</Text>
        <Text style={styles.value}>{formatDuration(durationSeconds)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.label}>Uppskattad kostnad</Text>
        <Text style={[styles.value, styles.cost]}>{estimate.usd}</Text>
      </View>
      {!hasEnough && (
        <Text style={styles.warning}>Otillräckligt saldo — fyll på för att fortsätta</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  insufficient: {
    backgroundColor: Colors.accentLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  label: {
    ...Typography.bodySmall,
  },
  value: {
    ...Typography.body,
    fontWeight: '600',
  },
  cost: {
    color: Colors.accent,
    fontSize: 20,
    fontWeight: '700',
  },
  warning: {
    ...Typography.caption,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
});
