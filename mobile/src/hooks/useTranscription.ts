import { useState, useCallback } from 'react';
import api from '../services/api';
import { TranscriptionResult } from '../types';

export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export function useTranscription() {
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(
    async (
      fileUri: string,
      languageCode = 'en-US'
    ): Promise<TranscriptionResult | null> => {
      setStatus('uploading');
      setProgress(0);
      setError(null);

      try {
        const fileName = fileUri.split('/').pop() ?? 'audio.m4a';
        const ext = fileName.split('.').pop()?.toLowerCase() ?? 'm4a';
        const mimeType = ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`;

        const formData = new FormData();
        formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);
        formData.append('language', languageCode);

        setStatus('processing');

        // Simulate progress (0→90%) while waiting for response
        const progressInterval = setInterval(() => {
          setProgress((p) => Math.min(p + 2, 90));
        }, 300);

        const { data } = await api.post<TranscriptionResult>(
          '/api/transcribe/file',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        clearInterval(progressInterval);
        setProgress(100);
        setStatus('done');

        return data;
      } catch (err: any) {
        setStatus('error');
        const message = err.response?.data?.error ?? err.message ?? 'Transcription failed';
        if (message.includes('INSUFFICIENT_BALANCE') || message === 'insufficient_balance') {
          setError('insufficient_balance');
        } else {
          setError(message);
        }
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  return { status, progress, error, transcribe, reset };
}
