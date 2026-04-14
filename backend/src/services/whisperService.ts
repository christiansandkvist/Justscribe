import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { UnsupportedFormatError } from '../types';

const SUPPORTED_FORMATS = new Set(['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.ogg', '.flac']);

const MIME_MAP: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.mp4': 'audio/mp4',
  '.m4a': 'audio/m4a',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
};

export interface SttResult {
  transcript: string;
  duration_seconds: number;
}

export async function transcribeFile(filePath: string): Promise<SttResult> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_FORMATS.has(ext)) throw new UnsupportedFormatError(ext);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable');

  const mimeType = MIME_MAP[ext] ?? 'audio/mpeg';

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: mimeType,
  });
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');

  console.log(`[whisper] POSTing ${path.basename(filePath)} (${ext}) to OpenAI…`);

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000, // 2 minutes
    }
  );

  console.log('[whisper] OpenAI response status:', response.status);

  const transcript = (response.data.text ?? '').trim();
  const duration_seconds = Number(response.data.duration ?? 0);

  return { transcript, duration_seconds };
}
