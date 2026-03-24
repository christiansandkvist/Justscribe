import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getBalance } from '../services/balance.js';
import { supabase } from '../config/supabase.js';

export function registerGetBalanceTool(server: McpServer) {
  server.registerTool(
    'get_balance',
    {
      description: `Check a user's current prepaid credit balance and recent usage history.
Returns balance in both credits and USD equivalent, plus pricing rates per second for each model.`,
      inputSchema: {
        user_id: z
          .string()
          .uuid()
          .describe('Supabase user UUID'),
        include_usage_history: z
          .boolean()
          .default(false)
          .describe('If true, includes the 5 most recent transcription jobs'),
      },
    },
    async ({ user_id, include_usage_history }) => {
      let balance;
      try {
        balance = await getBalance(user_id);
      } catch (e: any) {
        return err(`Could not retrieve balance: ${e.message}`);
      }

      const lines = [
        `BALANCE`,
        `  Credits:    ${balance.credits.toFixed(2)} credits`,
        `  Value:      ${balance.usd_display}`,
        ``,
        `PRICING`,
        `  Standard:   $${(balance.credits_per_second.standard * 60 * 0.01).toFixed(4)}/min  (Google STT v1)`,
        `  Chirp:      $${(balance.credits_per_second.chirp * 60 * 0.01).toFixed(4)}/min  (Google STT v2 — faster)`,
      ];

      if (include_usage_history) {
        const { data: logs } = await supabase
          .from('usage_logs')
          .select('created_at, model, duration_seconds, credits_charged')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (logs?.length) {
          lines.push('', 'RECENT USAGE');
          for (const log of logs) {
            const date = new Date(log.created_at).toLocaleString();
            lines.push(
              `  ${date}  ${log.model.padEnd(8)}  ${Number(log.duration_seconds).toFixed(1)}s  ` +
              `$${(Number(log.credits_charged) * 0.01).toFixed(4)}`
            );
          }
        } else {
          lines.push('', 'RECENT USAGE', '  No transcriptions yet.');
        }
      }

      return ok(lines.join('\n'));
    }
  );
}

const ok  = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const err = (text: string) => ({ content: [{ type: 'text' as const, text: `ERROR: ${text}` }] });
