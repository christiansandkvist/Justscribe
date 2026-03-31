import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function registerSaveTranscriptTool(server: McpServer) {
  server.registerTool(
    'save_transcript',
    {
      description: `Save a transcript as a .txt file on the user's local disk.
Default save location is ~/Documents/ScribeToGo/ unless overridden.
Returns the full path to the saved file.`,
      inputSchema: {
        transcript: z
          .string()
          .describe('The transcript text to save'),
        filename: z
          .string()
          .optional()
          .describe('Filename without extension (default: timestamp-based name)'),
        save_path: z
          .string()
          .optional()
          .describe('Absolute folder path to save in (default: ~/Documents/ScribeToGo/)'),
        include_metadata: z
          .boolean()
          .default(true)
          .describe('If true, prepends date/time and model info to the file'),
        model: z
          .enum(['standard', 'chirp'])
          .optional()
          .describe('Which model was used (included in metadata if include_metadata is true)'),
        duration_seconds: z
          .number()
          .optional()
          .describe('Recording duration in seconds (included in metadata)'),
      },
    },
    async ({ transcript, filename, save_path, include_metadata, model, duration_seconds }) => {
      // ── Resolve save directory ────────────────────────────────────────
      const dir = save_path
        ? path.resolve(save_path.replace(/^~/, os.homedir()))
        : path.join(os.homedir(), 'Documents', 'ScribeToGo');

      // ── Create directory if it doesn't exist ──────────────────────────
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e: any) {
        return err(`Could not create directory "${dir}": ${e.message}`);
      }

      // ── Build filename ────────────────────────────────────────────────
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const name = filename
        ? filename.replace(/\.txt$/i, '')
        : `transcript-${timestamp}`;
      const fullPath = path.join(dir, `${name}.txt`);

      // ── Build file content ────────────────────────────────────────────
      let content = '';
      if (include_metadata) {
        content += `ScribeToGo Transcript\n`;
        content += `=====================\n`;
        content += `Date:     ${now.toLocaleString()}\n`;
        if (model) content += `Model:    ${model === 'chirp' ? 'Chirp (Google STT v2)' : 'Standard (Google STT v1)'}\n`;
        if (duration_seconds) content += `Duration: ${duration_seconds.toFixed(1)}s\n`;
        content += `\n`;
      }
      content += transcript;

      // ── Write file ────────────────────────────────────────────────────
      try {
        fs.writeFileSync(fullPath, content, 'utf8');
      } catch (e: any) {
        return err(`Could not write file "${fullPath}": ${e.message}`);
      }

      return ok(
        `FILE SAVED\n\n` +
        `Path:     ${fullPath}\n` +
        `Size:     ${Buffer.byteLength(content, 'utf8')} bytes\n` +
        `Lines:    ${content.split('\n').length}`
      );
    }
  );
}

const ok  = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const err = (text: string) => ({ content: [{ type: 'text' as const, text: `ERROR: ${text}` }] });
