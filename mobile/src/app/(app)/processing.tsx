import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranscription } from '../../hooks/useTranscription';
import { ProgressBar } from '../../components/ProgressBar';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { formatDuration } from '../../constants/pricing';
import type { TranscriptionModel } from '../../types';

export default function ProcessingScreen() {
  const params = useLocalSearchParams<{
    fileUri: string;
    model: TranscriptionModel;
    durationSeconds: string;
  }>();

  const { transcribe, status, progress, error } = useTranscription();

  const durationSeconds = Number(params.durationSeconds ?? 0);

  useEffect(() => {
    startTranscription();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      if (error === 'insufficient_balance') {
        Alert.alert(
          'Otillräckligt saldo',
          'Fyll på ditt saldo för att fortsätta.',
          [{ text: 'OK', onPress: () => router.replace('/(app)/home') }]
        );
      } else {
        Alert.alert('Fel', error, [
          { text: 'OK', onPress: () => router.replace('/(app)/home') },
        ]);
      }
    }
  }, [error]);

  async function startTranscription() {
    const result = await transcribe(params.fileUri, params.model ?? 'standard');
    if (result) {
      router.replace({
        pathname: '/(app)/result',
        params: {
          transcript: result.transcript,
          duration_seconds: String(result.duration_seconds),
          credits_charged: String(result.credits_charged),
          new_balance: String(result.new_balance),
        },
      });
    }
  }

  const statusLabel =
    status === 'uploading' ? 'Laddar upp fil...' :
    status === 'processing' ? 'Transkriberar...' :
    status === 'error' ? 'Fel uppstod' :
    'Förbereder...';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Bearbetar</Text>

          {durationSeconds > 0 && (
            <Text style={styles.duration}>
              Fillängd: {formatDuration(durationSeconds)}
            </Text>
          )}

          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} />
            <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
          </View>

          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <Text style={styles.hint}>Stäng inte appen — vi arbetar på det</Text>
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
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  title: { ...Typography.h1 },
  duration: { ...Typography.bodySmall },
  progressContainer: {
    width: '100%',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  progressLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.accent,
  },
  statusLabel: { ...Typography.h3, color: Colors.secondary },
  hint: { ...Typography.caption, textAlign: 'center' },
});
