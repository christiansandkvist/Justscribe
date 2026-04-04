import { SpeechClient } from '@google-cloud/speech';

let speechClient: SpeechClient;

try {
  const raw = process.env.GOOGLE_CREDENTIALS_JSON ?? '';
  const credentials = JSON.parse(raw);
  speechClient = new SpeechClient({ credentials });
} catch (e) {
  console.error('[gcp] Failed to parse GOOGLE_CREDENTIALS_JSON — STT will not work:', e);
  speechClient = new SpeechClient();
}

export { speechClient };
