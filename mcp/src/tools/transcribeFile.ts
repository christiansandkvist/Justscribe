import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { transcribeStandard, transcribeChirp, deleteTempFile } from '../services/stt.js';
import { getBalance, deductBalance, creditsForSeconds, formatCost } from '../services/balance.js';

export function registerTranscribeFileTool(server: McpServer) {
  server.registerTool(
    'transcribe_audio_file',
    {
      description: `Transcribe an audio file (MP3, MP4, WAV, FLAC, OGG, M4A) using Google Speech-to-Text.
Charges prepaid credits from the user's balance (deducted after successful transcription).
Returns the transcript as plain text plus cost details.`,
      inputSchema: {
        user_id: z
          .string()
          .uuid()
          .describe('Supabase user UUID — identifies whose balance to charge'),
        file_path: z
          .string()
          .optional()
          .describe('Absolute path to audio file on disk (use this OR base64_audio)'),
        base64_audio: z
          .string()
          .optional()
          .describe('Base64-encoded audio content (use this OR file_path)'),
        mime_type: z
          .string()
          .optional()
          .default('audio/mpeg')
          .describe('MIME type of the audio when using base64_audio (e.g. audio/mpeg, audio/wav)'),
        model: z
          .enum(['standard', 'chirp'])
          .default('standard')
          .describe('standard = cheaper (Google STT v1) | chirp = faster (Google STT v2)'),
        language: z
          .string()
          .default('en-US')
          .describe('BCP-47 language code, e.g. en-US, sv-SE, es-ES'),
      },
    },
    async ({ user_id, file_path, base64_audio, mime_type, model, language }) => {
      // ── Validate input ────────────────────────────────────────────────
      if (!file_path && !base64_audio) {
        return err('Provide either file_path or base64_audio.');
      }

      // ── Check balance ─────────────────────────────────────────────────
      let balance;
      try {
        balance = await getBalance(user_id);
      } catch (e: any) {
        return err(`Balance check failed: ${e.message}`);
      }

      if (balance.credits <= 0) {
        return err(
          `No credits remaining (balance: ${balance.usd_display}). ` +
          `Use top_up_balance to add credits before transcribing.`
        );
      }

      // ── Prepare audio buffer ──────────────────────────────────────────
      let audioBuffer: Buffer;
      let ext: string;
      let tempPath: string | null = null;

      try {
        if (file_path) {
          ext = path.extname(file_path).toLowerCase();
          audioBuffer = fs.readFileSync(file_path);
        } else {
          // base64_audio path
          const extMap: Record<string, string> = {
            'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
            'audio/mp4': '.m4a', 'audio/m4a': '.m4a',
            'audio/wav': '.wav', 'audio/x-wav': '.wav',
            'audio/flac': '.flac',
            'audio/ogg': '.ogg',
            'audio/webm': '.webm',
            'video/mp4': '.mp4',
          };
          ext = extMap[mime_type!.toLowerCase()] ?? '.mp3';
          audioBuffer = Buffer.from(base64_audio!, 'base64');
        }
      } catch (e: any) {
        return err(`Failed to read audio: ${e.message}`);
      }

      // ── Transcribe ────────────────────────────────────────────────────
      let result;
      try {
        result = model === 'chirp'
          ? await transcribeChirp(audioBuffer, language)
          : await transcribeStandard(audioBuffer, ext, language);
      } catch (e: any) {
        if (tempPath) deleteTempFile(tempPath);
        return err(`Transcription failed: ${e.message}`);
      }

      if (tempPath) deleteTempFile(tempPath);

      // ── Charge balance ────────────────────────────────────────────────
      const credits_charged = creditsForSeconds(result.duration_seconds, model);
      let new_balance_credits: number;

      try {
        new_balance_credits = await deductBalance(user_id, credits_charged);
      } catch (e: any) {
        // Transcription succeeded but deduction failed — report both
        return ok(
          `TRANSCRIPT:\n${result.transcript || '(empty — no speech detected)'}\n\n` +
          `⚠️  Balance deduction failed: ${e.message}\n` +
          `Duration: ${result.duration_seconds.toFixed(1)}s | Cost: ${formatCost(credits_charged)}`
        );
      }

      // ── Return result ─────────────────────────────────────────────────
      return ok(
        `TRANSCRIPT:\n${result.transcript || '(empty — no speech detected)'}\n\n` +
        `---\n` +
        `Duration:     ${result.duration_seconds.toFixed(1)}s\n` +
        `Model:        ${model}\n` +
        `Cost:         ${formatCost(credits_charged)}\n` +
        `New balance:  $${(new_balance_credits * 0.01).toFixed(2)}`
      );
    }
  );
}

const ok  = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const err = (text: string) => ({ content: [{ type: 'text' as const, text: `ERROR: ${text}` }] });
