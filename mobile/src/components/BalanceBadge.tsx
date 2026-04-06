import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  balanceUsdDisplay: string;
  loading?: boolean;
}

export function BalanceBadge({ balanceUsdDisplay, loading }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.label}>Saldo</Text>
      <Text style={s.amount}>{loading ? '—' : balanceUsdDisplay}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131328', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, gap: 4, borderWidth: 1, borderColor: 'rgba(100,180,255,0.12)' },
  label:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  amount:    { fontSize: 13, color: '#ffffff', fontWeight: '600' },
});
