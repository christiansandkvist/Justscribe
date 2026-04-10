import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRecorder } from '../../hooks/useRecorder';
import { useTranscription } from '../../hooks/useTranscription';
import { useBalance } from '../../hooks/useBalance';
import { useLanguageStore } from '../../store/languageStore';
import { PulsingButton } from '../../components/PulsingButton';
import { formatDuration, estimateCost, DEFAULT_PRICING } from '../../constants/pricing';

const C = {
  bg:      '#0d0d1a',
  surface: '#131328',
  border:  'rgba(100,180,255,0.12)',
  white:   '#ffffff',
  white35: 'rgba(255,255,255,0.35)',
  cyan:    '#64b4ff',
  purple:  '#a78bfa',
};

export default function RecordScreen() {
  const recorder = useRecorder();
  const { transcribe, status, error } = useTranscription();
  const { balance_credits, balance_usd_display, pricing, loading } = useBalance();
  const { t } = useLanguageStore();
  const activePricing = pricing.find((p) => p.model === 'whisper') ?? DEFAULT_PRICING;
  const liveEstimate = estimateCost(recorder.elapsedSeconds, activePricing);

  useEffect(() => {
    if (error) {
      if (error === 'insufficient_balance') {
        Alert.alert(t.record.insufficientBalance, t.record.insufficientBalanceMsg, [
          { text: t.record.ok, onPress: () => router.replace('/(app)/home') }
        ]);
      } else {
        Alert.alert(t.record.error, error, [{ text: t.record.ok, onPress: () => router.back() }]);
      }
    }
  }, [error]);

  async function doTranscribe(uri: string) {
    const result = await transcribe(uri);
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

  async function handlePress() {
    if (recorder.state === 'idle') {
      await recorder.start();
    } else if (recorder.state === 'paused') {
      await recorder.resume();
    } else if (recorder.state === 'recording') {
      const uri = await recorder.stop();
      if (!uri) return;
      await doTranscribe(uri);
    }
  }

  const isProcessing = status === 'uploading' || status === 'processing';
  const isPaused = recorder.state === 'paused';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.container}>

        <View style={s.header}>
          <View style={s.balancePill}>
            <Text style={s.balanceText}>{loading ? '...' : balance_credits + ' cr'}</Text>
            <Text style={s.balanceSubText}>{loading ? '' : balance_usd_display}</Text>
          </View>
          <View style={s.whisperPill}>
            <Text style={s.whisperText}>Whisper</Text>
          </View>
        </View>

        {isPaused && recorder.wasInterrupted && (
          <View style={s.interruptBanner}>
            <Text style={s.interruptText}>⏸ Paused — call interrupted. Tap to resume.</Text>
          </View>
        )}

        <View style={s.center}>
          <Text style={[s.timer, isPaused && s.timerPaused]}>
            {isProcessing
              ? status === 'uploading' ? t.record.uploading : t.record.transcribing
              : formatDuration(recorder.elapsedSeconds)}
          </Text>
          {recorder.state === 'recording' && (
            <Text style={s.liveCost}>≈ {liveEstimate.usd}</Text>
          )}
          {isPaused && (
            <Text style={s.pausedLabel}>PAUSED</Text>
          )}
        </View>

        {!isProcessing && (
          <View style={s.buttonArea}>
            <PulsingButton onPress={handlePress} isRecording={recorder.state === 'recording'} />
            {recorder.state === 'idle' && <Text style={s.hint}>{t.record.tapToStart}</Text>}
            {recorder.state === 'recording' && <Text style={s.hint}>{t.record.tapToStop}</Text>}
            {isPaused && <Text style={s.hint}>Tap to resume recording</Text>}

            {recorder.state === 'recording' && (
              <TouchableOpacity style={s.pauseBtn} onPress={recorder.pause}>
                <Text style={s.pauseBtnText}>⏸ Pause</Text>
              </TouchableOpacity>
            )}

            {isPaused && (
              <TouchableOpacity
                style={s.stopBtn}
                onPress={async () => {
                  const uri = await recorder.stop();
                  if (!uri) return;
                  await doTranscribe(uri);
                }}
              >
                <LinearGradient colors={[C.cyan, C.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                <Text style={s.stopBtnText}>⏹ Stop & transcribe</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isProcessing && (
          <View style={s.processingArea}>
            <Text style={s.processingText}>
              {status === 'uploading' ? t.record.uploading : t.record.transcribing}
            </Text>
          </View>
        )}

        <Text style={s.cancelText} onPress={() => { recorder.reset(); router.back(); }}>
          {t.record.cancel}
        </Text>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0d0d1a' },
  container:       { flex: 1, padding: 24, justifyContent: 'space-between' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balancePill:     { backgroundColor: '#131328', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(100,180,255,0.12)' },
  balanceText:     { fontSize: 13, color: '#ffffff', fontWeight: '600' },
  balanceSubText:  { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '400' },
  whisperPill:     { backgroundColor: '#131328', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  whisperText:     { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  interruptBanner: { backgroundColor: 'rgba(167,139,250,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  interruptText:   { color: '#a78bfa', textAlign: 'center', fontWeight: '500', fontSize: 13 },
  center:          { alignItems: 'center', gap: 8 },
  timer:           { fontSize: 56, fontWeight: '700', color: '#ffffff', fontVariant: ['tabular-nums'] },
  timerPaused:     { color: 'rgba(255,255,255,0.35)' },
  pausedLabel:     { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 2 },
  liveCost:        { fontSize: 16, fontWeight: '500', color: '#64b4ff' },
  buttonArea:      { alignItems: 'center', gap: 20 },
  hint:            { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
  pauseBtn:        { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pauseBtnText:    { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  stopBtn:         { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 99, overflow: 'hidden' },
  stopBtnText:     { fontSize: 14, color: '#ffffff', fontWeight: '600', zIndex: 1 },
  processingArea:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  processingText:  { fontSize: 16, color: 'rgba(255,255,255,0.55)' },
  cancelText:      { fontSize: 14, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: 16 },
});
