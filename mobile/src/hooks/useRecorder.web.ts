// Web stub — uses browser MediaRecorder API
import { useState, useRef, useCallback, useEffect } from 'react';

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

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      mediaRecorder.current?.stop();
      if (recordedUri) URL.revokeObjectURL(recordedUri);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };

      recorder.start();
      mediaRecorder.current = recorder;
      setState('recording');
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } catch (err: any) {
      setError(err.message ?? 'Microphone access denied');
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    clearTimer();
    if (!mediaRecorder.current) return null;

    return new Promise((resolve) => {
      mediaRecorder.current!.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const uri = URL.createObjectURL(blob);
        setRecordedUri(uri);
        setState('stopped');
        resolve(uri);
      };
      mediaRecorder.current!.stop();
      mediaRecorder.current!.stream.getTracks().forEach((t) => t.stop());
    });
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    if (recordedUri) URL.revokeObjectURL(recordedUri);
    setState('idle');
    setElapsedSeconds(0);
    setRecordedUri(null);
    setError(null);
  }, [recordedUri]);

  return { state, elapsedSeconds, recordedUri, start, stop, reset, error };
}
