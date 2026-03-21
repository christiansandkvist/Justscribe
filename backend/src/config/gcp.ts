import { SpeechClient } from '@google-cloud/speech';

let clientOptions = {};

// Support inline JSON credentials (e.g. on Railway/Fly.io)
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    clientOptions = { credentials };
  } catch {
    throw new Error('Invalid GOOGLE_CREDENTIALS_JSON — must be valid JSON');
  }
}
// Otherwise GOOGLE_APPLICATION_CREDENTIALS env var points to a file path

export const speechClient = new SpeechClient(clientOptions);
