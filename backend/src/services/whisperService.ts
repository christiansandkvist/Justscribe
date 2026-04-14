import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
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

// Force HTTP/1.1 — avoids HTTP/2 "421 Misdirected Request" from OpenAI on Railway
const { Agent, fetch: undiciFetch } = require('undici');
const h1Agent = new Agent({ allowH2: false });
const h1Fetch = (url: any, init: any) =>
  undiciFetch(url, { ...init, dispatcher: h1Agent });

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable');
    _client = new OpenAI({ apiKey, fetch: h1Fetch });
  }
  return _client;
}

export async function transcribeFile(filePath: string): Promise<SttResult> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_FORMATS.has(ext)) throw new UnsupportedFormatError(ext);

  const client = getClient();

  const buffer = fs.readFileSync(filePath);
  const mimeType = MIME_MAP[ext] ?? 'audio/mpeg';
  const file = new File([buffer], path.basename(filePath), { type: mimeType });

  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
  });

  const transcript = (response as any).text?.trim() ?? '';
  const duration_seconds = Number((response as any).duration ?? 0);

  return { transcript, duration_seconds };
}
