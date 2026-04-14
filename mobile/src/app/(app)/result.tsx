import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { TranscriptCard } from '../../components/TranscriptCard';
import { BalanceBadge } from '../../components/BalanceBadge';
import { useLanguageStore } from '../../store/languageStore';
import { formatDuration, creditsToUsd } from '../../constants/pricing';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ transcript: string; duration_seconds: string; credits_charged: string; new_balance: string; }>();
  const { t } = useLanguageStore();
  const [copied, setCopied] = useState(false);
  const transcript = params.transcript ?? '';
  const durationSeconds = Number(params.duration_seconds ?? 0);
  const creditsCharged = Number(params.credits_charged ?? 0);
  const newBalance = Number(params.new_balance ?? 0);

  async function handleCopy() {
    await Clipboard.setStringAsync(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const filename = 'vocri_' + timestamp + '.txt';
    try {
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, transcript, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: t.result.shareTitle, UTI: 'public.plain-text' });
      } else {
        Alert.alert(t.result.shareUnavailable, t.result.shareUnavailableMsg);
      }
    } catch (err: any) {
      Alert.alert(t.result.saveError, err.message);
    }
  }

  const newBalanceDisplay = '$' + (newBalance * 0.01).toFixed(2);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>{t.result.title}</Text>
          <BalanceBadge balanceUsdDisplay={newBalanceDisplay} />
        </View>
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>{t.result.duration}</Text>
            <Text style={s.statValue}>{formatDuration(durationSeconds)}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statLabel}>{t.result.cost}</Text>
            <Text style={s.statValue}>{creditsToUsd(creditsCharged)}</Text>
          </View>
        </View>
        <TranscriptCard text={transcript} />
        <View style={s.actions}>
          <TouchableOpacity style={s.btnPrimary} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>{t.result.saveTxt}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={handleCopy} activeOpacity={0.85}>
            <Text style={s.btnSecondaryText}>{copied ? t.result.copied : t.result.copyText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnGhost} onPress={() => router.replace('/(app)/home')} activeOpacity={0.85}>
            <Text style={s.btnGhostText}>{t.result.newTranscription}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0d0d1a' },
  container:        { flex: 1, padding: 24, gap: 16 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:            { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  statsRow:         { flexDirection: 'row', backgroundColor: '#131328', borderRadius: 12, padding: 16, alignItems: 'center' },
  stat:             { flex: 1, alignItems: 'center', gap: 2 },
  statDivider:      { width: 1, height: 32, backgroundColor: 'rgba(100,180,255,0.12)' },
  statLabel:        { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  statValue:        { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  actions:          { gap: 8 },
  btnPrimary:       { height: 52, backgroundColor: '#64b4ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText:   { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  btnSecondary:     { height: 52, backgroundColor: '#131328', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(100,180,255,0.12)' },
  btnSecondaryText: { fontSize: 15, color: '#ffffff', fontWeight: '600' },
  btnGhost:         { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnGhostText:     { fontSize: 15, color: '#64b4ff', fontWeight: '600' },
});
