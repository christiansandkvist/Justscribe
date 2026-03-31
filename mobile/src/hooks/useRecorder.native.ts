import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderResult {
  state: RecorderState;
  elapsedSeconds: number;
  recordedUri: string | null;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => void;
  error: string | null;
  wasInterrupted: boolean;
}

export function useRecorder(): RecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasInterrupted, setWasInterrupted] = useState(false);

  const recording = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<RecorderState>('idle');
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => { stateRef.current = state; }, [state]);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  };

  const pause = useCallback(async () => {
    if (!recording.current || stateRef.current !== 'recording') return;
    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      setRecordedUri(uri);
      clearTimer();
      setState('paused');
    } catch (err: any) {
      setError(err.message ?? 'Failed to pause');
    }
  }, []);

  const resume = useCallback(async () => {
    if (stateRef.current !== 'paused') return;
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.current = rec;
      setState('recording');
      setWasInterrupted(false);
      startTimer();
    } catch (err: any) {
      setError(err.message ?? 'Failed to resume');
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev === 'active' && nextState !== 'active') {
        if (stateRef.current === 'recording') {
          if (recording.current) {
            try { await recording.current.stopAndUnloadAsync(); const uri = recording.current.getURI(); recording.current = null; setRecordedUri(uri); } catch {}
          }
          clearTimer(); setState('paused'); setWasInterrupted(true);
        }
      }
      if (prev !== 'active' && nextState === 'active') {
        if (stateRef.current === 'paused') {
          try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            recording.current = rec; setState('recording'); startTimer();
          } catch {}
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => { clearTimer(); recording.current?.stopAndUnloadAsync().catch(() => {}); };
  }, []);

  const start = useCallback(async () => {
    setError(null); setWasInterrupted(false);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { setError('Microphone permission denied'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.current = rec; setState('recording'); setElapsedSeconds(0); startTimer();
    } catch (err: any) { setError(err.message ?? 'Failed to start recording'); }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    clearTimer();
    if (!recording.current) return recordedUri;
    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI() ?? recordedUri;
      recording.current = null; setState('stopped'); setRecordedUri(uri);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      return uri;
    } catch (err: any) { setError(err.message ?? 'Failed to stop recording'); return null; }
  }, [recordedUri]);

  const reset = useCallback(() => {
    clearTimer(); recording.current?.stopAndUnloadAsync().catch(() => {}); recording.current = null;
    setState('idle'); setElapsedSeconds(0); setRecordedUri(null); setError(null); setWasInterrupted(false);
  }, []);

  return { state, elapsedSeconds, recordedUri, start, stop, pause, resume, reset, error, wasInterrupted };
}
