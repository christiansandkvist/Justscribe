import { speechClient } from '../config/gcp.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export interface SttResult {
  transcript: string;
  duration_seconds: number;
}

type AudioEncoding =
  | 'LINEAR16' | 'FLAC' | 'MP3' | 'OGG_OPUS' | 'WEBM_OPUS' | 'ENCODING_UNSPECIFIED';

const EXT_TO_ENCODING: Record<string, AudioEncoding> = {
  '.wav':  'LINEAR16',
  '.flac': 'FLAC',
  '.mp3':  'MP3',
  '.mp4':  'MP3',
  '.m4a':  'MP3',
  '.ogg':  'OGG_OPUS',
  '.webm': 'WEBM_OPUS',
};

// ── Standard (v1) ─────────────────────────────────────────────────────────
export async function transcribeStandard(
  audioBuffer: Buffer,
  ext: string,
  languageCode = 'en-US'
): Promise<SttResult> {
  const encoding = EXT_TO_ENCODING[ext.toLowerCase()];
  if (!encoding) throw new Error(`Unsupported format: ${ext}`);

  const config = {
    encoding: encoding as any,
    sampleRateHertz: encoding === 'LINEAR16' ? 16000 : undefined,
    languageCode,
    enableAutomaticPunctuation: true,
    model: 'latest_long',
    enableWordTimeOffsets: true,
  };

  const audio = { content: audioBuffer.toString('base64') };

  const [operation] = await speechClient.longRunningRecognize({ config, audio });
  const [response] = await (operation as any).promise();

  if (!response.results?.length) return { transcript: '', duration_seconds: 0 };

  const transcript = response.results
    .map((r: any) => r.alternatives?.[0]?.transcript ?? '')
    .join(' ')
    .trim();

  return { transcript, duration_seconds: extractDuration(response.results) };
}

// ── Chirp (v2) ────────────────────────────────────────────────────────────
export async function transcribeChirp(
  audioBuffer: Buffer,
  languageCode = 'en-US'
): Promise<SttResult> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location  = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
  if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT_ID is required for Chirp');

  const recognizer = `projects/${projectId}/locations/${location}/recognizers/_`;

  const [operation] = await (speechClient as any).batchRecognize({
    recognizer,
    config: {
      autoDecodingConfig: {},
      languageCodes: [languageCode],
      model: 'chirp',
      features: { enableAutomaticPunctuation: true, enableWordTimeOffsets: true },
    },
    files: [{ content: audioBuffer }],
  });

  const [response] = await (operation as any).promise();
  const results = Object.values(response.results ?? {})[0] as any;

  if (!results?.transcript?.results?.length) return { transcript: '', duration_seconds: 0 };

  const transcript = results.transcript.results
    .map((r: any) => r.alternatives?.[0]?.transcript ?? '')
    .join(' ')
    .trim();

  return { transcript, duration_seconds: extractDuration(results.transcript.results) };
}

// ── Helpers ───────────────────────────────────────────────────────────────
function extractDuration(results: any[]): number {
  for (let i = results.length - 1; i >= 0; i--) {
    const words = results[i]?.alternatives?.[0]?.words;
    if (words?.length) {
      const last = words[words.length - 1];
      if (last?.endTime) {
        return Number(last.endTime.seconds ?? 0) + Number(last.endTime.nanos ?? 0) / 1e9;
      }
    }
  }
  return 0;
}

/** Write base64 audio to a temp file, return its path and extension. */
export function base64ToTempFile(base64: string, mimeType: string): string {
  const extMap: Record<string, string> = {
    'audio/mpeg': '.mp3',
    'audio/mp3':  '.mp3',
    'audio/mp4':  '.m4a',
    'audio/m4a':  '.m4a',
    'audio/wav':  '.wav',
    'audio/x-wav':'.wav',
    'audio/flac': '.flac',
    'audio/ogg':  '.ogg',
    'audio/webm': '.webm',
    'video/mp4':  '.mp4',
  };
  const ext = extMap[mimeType.toLowerCase()] ?? '.mp3';
  const filePath = path.join(os.tmpdir(), `scribetogo_${randomUUID()}${ext}`);
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return filePath;
}

export function deleteTempFile(filePath: string): void {
  try { fs.unlinkSync(filePath); } catch { /* already gone */ }
}
