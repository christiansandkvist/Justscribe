import { useState, useRef, useCallback } from 'react';

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

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setRecordedUri(URL.createObjectURL(blob));
      };
      mr.start();
      mediaRecorder.current = mr;
      setState('recording');
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } catch (err: any) {
      setError(err.message ?? 'Failed to start');
    }
  }, []);

  const pause = useCallback(async () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.pause();
      clearTimer();
      setState('paused');
    }
  }, []);

  const resume = useCallback(async () => {
    if (mediaRecorder.current?.state === 'paused') {
      mediaRecorder.current.resume();
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      setState('recording');
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    clearTimer();
    return new Promise((resolve) => {
      if (!mediaRecorder.current) { resolve(null); return; }
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const uri = URL.createObjectURL(blob);
        setRecordedUri(uri);
        setState('stopped');
        resolve(uri);
      };
      mediaRecorder.current.stop();
    });
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    if (mediaRecorder.current?.state !== 'inactive') mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    setState('idle');
    setElapsedSeconds(0);
    setRecordedUri(null);
    setError(null);
  }, []);

  return { state, elapsedSeconds, recordedUri, start, stop, pause, resume, reset, error, wasInterrupted: false };
}
