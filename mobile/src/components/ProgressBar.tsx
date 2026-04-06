import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0–100
}

export function ProgressBar({ progress }: Props) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  track: { height: 8, backgroundColor: 'rgba(100,180,255,0.12)', borderRadius: 99, overflow: 'hidden', width: '100%' },
  fill:  { height: '100%', backgroundColor: '#64b4ff', borderRadius: 99 },
});
