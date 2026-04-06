import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    <View style={[s.container, !hasEnough && s.insufficient]}>
      <View style={s.row}>
        <Text style={s.label}>Fillängd</Text>
        <Text style={s.value}>{formatDuration(durationSeconds)}</Text>
      </View>
      <View style={s.divider} />
      <View style={s.row}>
        <Text style={s.label}>Uppskattad kostnad</Text>
        <Text style={[s.value, s.cost]}>{estimate.usd}</Text>
      </View>
      {!hasEnough && (
        <Text style={s.warning}>Otillräckligt saldo — fyll på för att fortsätta</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { backgroundColor: '#131328', borderRadius: 12, padding: 16, gap: 8 },
  insufficient: { backgroundColor: 'rgba(167,139,250,0.1)' },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider:      { height: 1, backgroundColor: 'rgba(100,180,255,0.12)' },
  label:        { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  value:        { fontSize: 15, color: '#ffffff', fontWeight: '600' },
  cost:         { color: '#64b4ff', fontSize: 20, fontWeight: '700' },
  warning:      { fontSize: 12, color: '#a78bfa', marginTop: 8 },
});
