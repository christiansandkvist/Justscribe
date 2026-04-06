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
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.center}>
          <Text style={s.title}>Bearbetar</Text>

          {durationSeconds > 0 && (
            <Text style={s.duration}>
              Fillängd: {formatDuration(durationSeconds)}
            </Text>
          )}

          <View style={s.progressContainer}>
            <ProgressBar progress={progress} />
            <Text style={s.progressLabel}>{Math.round(progress)}%</Text>
          </View>

          <Text style={s.statusLabel}>{statusLabel}</Text>
          <Text style={s.hint}>Stäng inte appen — vi arbetar på det</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#0d0d1a' },
  container:         { flex: 1, padding: 24, justifyContent: 'center' },
  center:            { alignItems: 'center', gap: 24 },
  title:             { fontSize: 32, fontWeight: '700', color: '#ffffff' },
  duration:          { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  progressContainer: { width: '100%', gap: 8, alignItems: 'center' },
  progressLabel:     { fontSize: 15, color: '#64b4ff', fontWeight: '700' },
  statusLabel:       { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  hint:              { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
});
