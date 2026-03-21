import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useRecorder } from '../../hooks/useRecorder';
import { useTranscription } from '../../hooks/useTranscription';
import { useBalance } from '../../hooks/useBalance';
import { PulsingButton } from '../../components/PulsingButton';
import { BalanceBadge } from '../../components/BalanceBadge';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { formatDuration, estimateCost, DEFAULT_PRICING } from '../../constants/pricing';
import type { TranscriptionModel } from '../../types';

export default function RecordScreen() {
  const { model } = useLocalSearchParams<{ model: TranscriptionModel }>();
  const recorder = useRecorder();
  const { transcribe, status, error } = useTranscription();
  const { balance_credits, balance_usd_display, pricing, loading } = useBalance();

  const activePricing =
    pricing.find((p) => p.model === model) ??
    DEFAULT_PRICING[model ?? 'standard'];

  const liveEstimate = estimateCost(recorder.elapsedSeconds, activePricing);

  useEffect(() => {
    if (error) {
      if (error === 'insufficient_balance') {
        Alert.alert(
          'Otillräckligt saldo',
          'Fyll på ditt saldo för att fortsätta.',
          [{ text: 'OK', onPress: () => router.replace('/(app)/home') }]
        );
      } else {
        Alert.alert('Fel', error, [{ text: 'OK', onPress: () => router.back() }]);
      }
    }
  }, [error]);

  async function handlePress() {
    if (recorder.state === 'idle') {
      await recorder.start();
    } else if (recorder.state === 'recording') {
      const uri = await recorder.stop();
      if (!uri) return;

      const result = await transcribe(uri, model ?? 'standard');
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
  }

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BalanceBadge balanceUsdDisplay={balance_usd_display} loading={loading} />
          <Text style={styles.modelBadge}>{model === 'chirp' ? '⚡ Snabb' : 'Standard'}</Text>
        </View>

        {/* Timer */}
        <View style={styles.center}>
          <Text style={styles.timer}>
            {isProcessing ? 'Transkriberar...' : formatDuration(recorder.elapsedSeconds)}
          </Text>
          {recorder.state === 'recording' && (
            <Text style={styles.liveCost}>≈ {liveEstimate.usd}</Text>
          )}
        </View>

        {/* Record button */}
        {!isProcessing && (
          <View style={styles.buttonArea}>
            <PulsingButton
              onPress={handlePress}
              isRecording={recorder.state === 'recording'}
            />
            {recorder.state === 'idle' && (
              <Text style={styles.hint}>Tryck för att börja spela in</Text>
            )}
            {recorder.state === 'recording' && (
              <Text style={styles.hint}>Tryck för att stoppa och transkribera</Text>
            )}
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingArea}>
            <Text style={styles.processingText}>
              {status === 'uploading' ? 'Laddar upp...' : 'Transkriberar...'}
            </Text>
          </View>
        )}

        {/* Cancel */}
        <Text
          style={styles.cancelText}
          onPress={() => {
            recorder.reset();
            router.back();
          }}
        >
          Avbryt
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelBadge: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.secondary,
  },
  center: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timer: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  liveCost: {
    ...Typography.h3,
    color: Colors.accent,
  },
  buttonArea: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  hint: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  processingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    ...Typography.h3,
    color: Colors.secondary,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.secondary,
    textAlign: 'center',
    padding: Spacing.md,
  },
});
