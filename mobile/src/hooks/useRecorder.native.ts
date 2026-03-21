import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

export type RecorderState = 'idle' | 'recording' | 'stopped';

export interface RecorderResult {
  state: RecorderState;
  elapsedSeconds: number;
  recordedUri: string | null;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  reset: () => void;
  error: string | null;
}

export function useRecorder(): RecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recording = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      recording.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = rec;
      setState('recording');
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      setError(err.message ?? 'Failed to start recording');
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    clearTimer();

    if (!recording.current) return null;

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      setState('stopped');
      setRecordedUri(uri);

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      return uri;
    } catch (err: any) {
      setError(err.message ?? 'Failed to stop recording');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    recording.current?.stopAndUnloadAsync().catch(() => {});
    recording.current = null;
    setState('idle');
    setElapsedSeconds(0);
    setRecordedUri(null);
    setError(null);
  }, []);

  return { state, elapsedSeconds, recordedUri, start, stop, reset, error };
}
