import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',       // mp3
  'audio/mp4',        // m4a, mp4
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/ogg',
  'video/mp4',        // some mp4 files are classified as video
];

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

export async function pickAudioFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',   // broad filter — shows all audio sources including iCloud & On My iPhone
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    size: asset.size ?? 0,
    mimeType: asset.mimeType,
  };
}

export async function getAudioDuration(uri: string): Promise<number> {
  try {
    const { sound, status } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false }
    );
    const durationMs = (status as any).durationMillis ?? 0;
    await sound.unloadAsync();
    return durationMs / 1000;
  } catch {
    return 0;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
