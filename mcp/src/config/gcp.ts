import { SpeechClient } from '@google-cloud/speech';

let clientOptions = {};

if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    clientOptions = { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) };
  } catch {
    throw new Error('GOOGLE_CREDENTIALS_JSON is not valid JSON');
  }
}

export const speechClient = new SpeechClient(clientOptions);
