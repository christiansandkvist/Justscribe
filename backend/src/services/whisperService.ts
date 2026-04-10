import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { UnsupportedFormatError } from '../types';

const SUPPORTED_FORMATS = new Set(['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.ogg', '.flac']);

export interface SttResult {
  transcript: string;
  duration_seconds: number;
}

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable');
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export async function transcribeFile(filePath: string): Promise<SttResult> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_FORMATS.has(ext)) throw new UnsupportedFormatError(ext);

  const client = getClient();

  const response = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'verbose_json',
  });

  const transcript = (response as any).text?.trim() ?? '';
  const duration_seconds = Number((response as any).duration ?? 0);

  return { transcript, duration_seconds };
}
