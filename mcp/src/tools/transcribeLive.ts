import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { transcribeStandard, transcribeChirp } from '../services/stt.js';
import { getBalance, deductBalance, creditsForSeconds, formatCost } from '../services/balance.js';

export function registerTranscribeLiveTool(server: McpServer) {
  server.registerTool(
    'transcribe_live_recording',
    {
      description: `Transcribe a completed live recording captured via microphone.
The recording is passed as base64-encoded audio (e.g. recorded with the Vocri mobile app or any recorder).
Uses the same Google STT pipeline as file transcription but tagged as a live recording in usage logs.
Charges prepaid credits per second of audio.`,
      inputSchema: {
        user_id: z
          .string()
          .uuid()
          .describe('Supabase user UUID'),
        base64_audio: z
          .string()
          .describe('Base64-encoded audio recording (WAV or WebM from browser MediaRecorder, M4A from mobile)'),
        mime_type: z
          .enum(['audio/wav', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/mpeg'])
          .default('audio/wav')
          .describe('MIME type of the recorded audio'),
        model: z
          .enum(['standard', 'chirp'])
          .default('chirp')
          .describe('chirp is recommended for live recordings — faster result'),
        language: z
          .string()
          .default('en-US')
          .describe('BCP-47 language code'),
        duration_hint_seconds: z
          .number()
          .positive()
          .optional()
          .describe('Approximate recording duration in seconds (optional — used for upfront cost estimate only)'),
      },
    },
    async ({ user_id, base64_audio, mime_type, model, language, duration_hint_seconds }) => {
      // ── Show cost estimate if duration hint provided ───────────────────
      if (duration_hint_seconds) {
        const estimatedCredits = creditsForSeconds(duration_hint_seconds, model);
        const balance = await getBalance(user_id).catch(() => null);
        if (balance && balance.credits < estimatedCredits) {
          return err(
            `Insufficient balance for this recording.\n` +
            `Estimated cost: ${formatCost(estimatedCredits)} (~${duration_hint_seconds}s at ${model} rate)\n` +
            `Current balance: ${balance.usd_display}\n` +
            `Use top_up_balance to add credits.`
          );
        }
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
          `Use top_up_balance to add credits.`
        );
      }

      // ── Decode audio ──────────────────────────────────────────────────
      let audioBuffer: Buffer;
      try {
        audioBuffer = Buffer.from(base64_audio, 'base64');
      } catch {
        return err('Invalid base64_audio — could not decode.');
      }

      const extMap: Record<string, string> = {
        'audio/wav': '.wav', 'audio/webm': '.webm',
        'audio/mp4': '.m4a', 'audio/m4a': '.m4a', 'audio/mpeg': '.mp3',
      };
      const ext = extMap[mime_type] ?? '.wav';

      // ── Transcribe ────────────────────────────────────────────────────
      let result;
      try {
        result = model === 'chirp'
          ? await transcribeChirp(audioBuffer, language)
          : await transcribeStandard(audioBuffer, ext, language);
      } catch (e: any) {
        return err(`Transcription failed: ${e.message}`);
      }

      // ── Log usage ─────────────────────────────────────────────────────
      const credits_charged = creditsForSeconds(result.duration_seconds, model);
      let new_balance_credits: number;

      try {
        new_balance_credits = await deductBalance(user_id, credits_charged);

        // Write to usage_logs (non-fatal if it fails)
        try {
          const { supabase } = await import('../config/supabase.js');
          await supabase.from('usage_logs').insert({
            user_id,
            model,
            duration_seconds: result.duration_seconds,
            credits_charged,
          });
        } catch { /* ignore logging failures */ }
      } catch (e: any) {
        return ok(
          `TRANSCRIPT:\n${result.transcript || '(empty — no speech detected)'}\n\n` +
          `⚠️  Balance deduction failed: ${e.message}\n` +
          `Duration: ${result.duration_seconds.toFixed(1)}s`
        );
      }

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
