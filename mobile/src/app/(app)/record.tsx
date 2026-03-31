import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useRecorder } from '../../hooks/useRecorder';
import { useTranscription } from '../../hooks/useTranscription';
import { useBalance } from '../../hooks/useBalance';
import { useLanguageStore } from '../../store/languageStore';
import { PulsingButton } from '../../components/PulsingButton';
import { BalanceBadge } from '../../components/BalanceBadge';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { formatDuration, estimateCost, DEFAULT_PRICING } from '../../constants/pricing';
import type { TranscriptionModel } from '../../types';

export default function RecordScreen() {
  const { model } = useLocalSearchParams<{ model: TranscriptionModel }>();
  const recorder = useRecorder();
  const { transcribe, status, error } = useTranscription();
  const { balance_usd_display, pricing, loading } = useBalance();
  const { t } = useLanguageStore();
  const activePricing = pricing.find((p) => p.model === model) ?? DEFAULT_PRICING[model ?? 'standard'];
  const liveEstimate = estimateCost(recorder.elapsedSeconds, activePricing);

  useEffect(() => {
    if (error) {
      if (error === 'insufficient_balance') {
        Alert.alert(t.record.insufficientBalance, t.record.insufficientBalanceMsg, [
          { text: t.record.ok, onPress: () => router.replace('/(app)/home') },
        ]);
      } else {
        Alert.alert(t.record.error, error, [{ text: t.record.ok, onPress: () => router.back() }]);
      }
    }
  }, [error]);

  async function handlePress() {
    if (recorder.state === 'idle') {
      await recorder.start();
    } else if (recorder.state === 'paused') {
      await recorder.resume();
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
  const isPaused = recorder.state === 'paused';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BalanceBadge balanceUsdDisplay={balance_usd_display} loading={loading} />
          <Text style={styles.modelBadge}>
            {model === 'chirp' ? t.record.fastBadge : t.record.standardBadge}
          </Text>
        </View>

        {/* Interrupted banner */}
        {isPaused && recorder.wasInterrupted && (
          <View style={styles.interruptBanner}>
            <Text style={styles.interruptText}>⏸ Paused — call interrupted. Tap to resume.</Text>
          </View>
        )}

        <View style={styles.center}>
          <Text style={[styles.timer, isPaused && styles.timerPaused]}>
            {isProcessing
              ? status === 'uploading'
                ? t.record.uploading
                : t.record.transcribing
              : formatDuration(recorder.elapsedSeconds)}
          </Text>
          {recorder.state === 'recording' && (
            <Text style={styles.liveCost}>≈ {liveEstimate.usd}</Text>
          )}
          {isPaused && (
            <Text style={styles.pausedLabel}>PAUSED</Text>
          )}
        </View>

        {!isProcessing && (
          <View style={styles.buttonArea}>
            <PulsingButton
              onPress={handlePress}
              isRecording={recorder.state === 'recording'}
            />
            {recorder.state === 'idle' && <Text style={styles.hint}>{t.record.tapToStart}</Text>}
            {recorder.state === 'recording' && <Text style={styles.hint}>{t.record.tapToStop}</Text>}
            {isPaused && <Text style={styles.hint}>Tap to resume recording</Text>}

            {/* Manual pause button while recording */}
            {recorder.state === 'recording' && (
              <TouchableOpacity style={styles.pauseBtn} onPress={recorder.pause}>
                <Text style={styles.pauseBtnText}>⏸ Pause</Text>
              </TouchableOpacity>
            )}

            {/* Stop button while paused */}
            {isPaused && (
              <TouchableOpacity
                style={styles.stopBtn}
                onPress={async () => {
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
                }}
              >
                <Text style={styles.stopBtnText}>⏹ Stop & transcribe</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingArea}>
            <Text style={styles.processingText}>
              {status === 'uploading' ? t.record.uploading : t.record.transcribing}
            </Text>
          </View>
        )}

        <Text
          style={styles.cancelText}
          onPress={() => { recorder.reset(); router.back(); }}
        >
          {t.record.cancel}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelBadge: { ...Typography.bodySmall, fontWeight: '700', color: Colors.secondary },
  interruptBanner: { backgroundColor: '#FFF3CD', borderRadius: 8, padding: Spacing.md, marginVertical: Spacing.sm },
  interruptText: { color: '#856404', textAlign: 'center', fontWeight: '600' },
  center: { alignItems: 'center', gap: Spacing.sm },
  timer: { fontSize: 56, fontWeight: '700', color: Colors.primary, fontVariant: ['tabular-nums'] },
  timerPaused: { color: Colors.secondary },
  pausedLabel: { fontSize: 14, fontWeight: '700', color: Colors.secondary, letterSpacing: 2 },
  liveCost: { ...Typography.h3, color: Colors.accent },
  buttonArea: { alignItems: 'center', gap: Spacing.lg },
  hint: { ...Typography.bodySmall, textAlign: 'center' },
  pauseBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: Colors.secondary },
  pauseBtnText: { ...Typography.body, color: Colors.secondary },
  stopBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.primary },
  stopBtnText: { ...Typography.body, color: '#fff', fontWeight: '700' },
  processingArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  processingText: { ...Typography.h3, color: Colors.secondary },
  cancelText: { ...Typography.body, color: Colors.secondary, textAlign: 'center', padding: Spacing.md },
});
