import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { TranscriptCard } from '../../components/TranscriptCard';
import { BalanceBadge } from '../../components/BalanceBadge';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { formatDuration, creditsToUsd } from '../../constants/pricing';

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    transcript: string;
    duration_seconds: string;
    credits_charged: string;
    new_balance: string;
  }>();

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
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `justscribe_${timestamp}.txt`;

    try {
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, transcript, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Spara transkription',
          UTI: 'public.plain-text',
        });
      } else {
        Alert.alert('Delning ej tillgänglig', 'Din enhet stöder inte delning.');
      }
    } catch (err: any) {
      Alert.alert('Fel', `Kunde inte spara filen: ${err.message}`);
    }
  }

  const newBalanceDisplay = `$${(newBalance * 0.01).toFixed(2)}`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Transkription klar</Text>
          <BalanceBadge balanceUsdDisplay={newBalanceDisplay} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Längd</Text>
            <Text style={styles.statValue}>{formatDuration(durationSeconds)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Kostnad</Text>
            <Text style={styles.statValue}>{creditsToUsd(creditsCharged)}</Text>
          </View>
        </View>

        {/* Transcript */}
        <TranscriptCard text={transcript} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Spara som .txt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleCopy} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>{copied ? '✓ Kopierad!' : 'Kopiera text'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => router.replace('/(app)/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnGhostText}>Ny transkribering</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...Typography.h2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  statLabel: { ...Typography.caption },
  statValue: { ...Typography.h3 },
  actions: {
    gap: Spacing.sm,
  },
  btnPrimary: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    ...Typography.body,
    fontWeight: '600',
  },
  btnGhost: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '600',
  },
});
