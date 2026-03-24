import { SpeechClient } from '@google-cloud/speech';

// Production-safe: reads inline JSON from env var (Railway / Fly.io)
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON!);
export const speechClient = new SpeechClient({ credentials });
