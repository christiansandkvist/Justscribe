import { SpeechClient } from '@google-cloud/speech';

let speechClient: SpeechClient;

try {
  const raw = process.env.GOOGLE_CREDENTIALS_BASE64 ?? process.env.GOOGLE_CREDENTIALS_JSON ?? '';
  const json = raw.startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8');
  const credentials = JSON.parse(json);
  speechClient = new SpeechClient({ credentials });
  console.log('[gcp] SpeechClient initialized successfully');
} catch (e) {
  console.error('[gcp] Failed to initialize SpeechClient:', e);
  speechClient = new SpeechClient();
}

export { speechClient };
