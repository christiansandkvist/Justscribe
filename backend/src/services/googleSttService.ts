import { speechClient } from '../config/gcp';
import { TranscriptionModel, UnsupportedFormatError } from '../types';
import path from 'path';

const ENCODING_MAP: Record<string, string> = {
  '.wav': 'LINEAR16',
  '.flac': 'FLAC',
  '.mp3': 'MP3',
  '.mp4': 'MP3',
  '.m4a': 'MP3',
  '.ogg': 'OGG_OPUS',
  '.webm': 'WEBM_OPUS',
};

export interface SttResult {
  transcript: string;
  duration_seconds: number;
}

export async function transcribeFile(
  filePath: string,
  model: TranscriptionModel,
  languageCode = 'en-US'
): Promise<SttResult> {
  if (model === 'chirp') {
    return transcribeChirp(filePath, languageCode);
  }
  return transcribeStandard(filePath, languageCode);
}

async function transcribeStandard(
  filePath: string,
  languageCode: string
): Promise<SttResult> {
  const ext = path.extname(filePath).toLowerCase();
  const encoding = ENCODING_MAP[ext];

  if (!encoding) throw new UnsupportedFormatError(ext);

  const fs = await import('fs');
  const audioBytes = fs.readFileSync(filePath).toString('base64');

  const config = {
    encoding: encoding as any,
    sampleRateHertz: encoding === 'LINEAR16' ? 16000 : undefined,
    languageCode,
    enableAutomaticPunctuation: true,
    model: 'latest_long',
    enableWordTimeOffsets: true,
  };

  const audio = { content: audioBytes };

  // Files under 60s: synchronous. Over 60s: long-running operation.
  // We'll always use longRunningRecognize for simplicity and correctness.
  const [operation] = await speechClient.longRunningRecognize({ config, audio });
  const [response] = await operation.promise();

  if (!response.results?.length) {
    return { transcript: '', duration_seconds: 0 };
  }

  const transcript = response.results
    .map((r) => r.alternatives?.[0]?.transcript ?? '')
    .join(' ')
    .trim();

  const duration_seconds = extractDuration(response.results);

  return { transcript, duration_seconds };
}

async function transcribeChirp(
  filePath: string,
  languageCode: string
): Promise<SttResult> {
  const ext = path.extname(filePath).toLowerCase();
  if (!ENCODING_MAP[ext]) throw new UnsupportedFormatError(ext);

  const fs = await import('fs');
  const audioBytes = fs.readFileSync(filePath).toString('base64');

  // Chirp uses v2 API with a different recognizer path
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';

  if (!projectId) throw new Error('Missing GOOGLE_CLOUD_PROJECT_ID for Chirp');

  const config = {
    autoDecodingConfig: {},
    languageCodes: [languageCode],
    model: 'chirp',
    features: {
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
    },
  };

  const recognizer = `projects/${projectId}/locations/${location}/recognizers/_`;

  const [operation] = await (speechClient as any).batchRecognize({
    recognizer,
    config,
    files: [{ content: Buffer.from(audioBytes, 'base64') }],
  });

  const [response] = await operation.promise();

  const results = Object.values(response.results ?? {})[0] as any;
  if (!results?.transcript?.results?.length) {
    return { transcript: '', duration_seconds: 0 };
  }

  const transcript = results.transcript.results
    .map((r: any) => r.alternatives?.[0]?.transcript ?? '')
    .join(' ')
    .trim();

  const duration_seconds = extractDuration(results.transcript.results);

  return { transcript, duration_seconds };
}

function extractDuration(results: any[]): number {
  // Get end time of last word in last result
  for (let i = results.length - 1; i >= 0; i--) {
    const words = results[i]?.alternatives?.[0]?.words;
    if (words?.length) {
      const lastWord = words[words.length - 1];
      const endTime = lastWord?.endTime;
      if (endTime) {
        const seconds = Number(endTime.seconds ?? 0);
        const nanos = Number(endTime.nanos ?? 0);
        return seconds + nanos / 1e9;
      }
    }
  }
  return 0;
}
