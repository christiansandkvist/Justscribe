import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createCheckoutSession, listPackages, type PackageLabel } from '../services/topup.js';

export function registerTopUpTool(server: McpServer) {
  server.registerTool(
    'top_up_balance',
    {
      description: `Add prepaid credits to a user's ScribeToGo balance via Stripe.
Returns a Stripe Checkout URL — the user must open it in their browser to complete the payment.
Credits are added automatically after successful payment via webhook.

Available packages:
  $5  →  500 credits  (~35 minutes Standard / ~8 minutes Chirp)
  $10 →  1,050 credits (+5% bonus)
  $25 →  2,750 credits (+10% bonus)
  $50 →  6,000 credits (+20% bonus)`,
      inputSchema: {
        user_id: z
          .string()
          .uuid()
          .describe('Supabase user UUID'),
        package: z
          .enum(['$5', '$10', '$25', '$50'])
          .describe('Credit package to purchase'),
      },
    },
    async ({ user_id, package: pkg }) => {
      // Show package list context
      const packages = listPackages();
      const selected = packages.find((p) => p.label === pkg);

      if (!selected) {
        const list = packages
          .map((p) => `  ${p.label.padEnd(4)} → ${p.credits} credits`)
          .join('\n');
        return err(`Unknown package "${pkg}".\n\nAvailable packages:\n${list}`);
      }

      let session;
      try {
        session = await createCheckoutSession(user_id, pkg as PackageLabel);
      } catch (e: any) {
        return err(`Failed to create checkout session: ${e.message}`);
      }

      const minutesStandard = (session.credits_to_add / 0.004 / 60).toFixed(0);
      const minutesChirp    = (session.credits_to_add / 0.0168 / 60).toFixed(0);

      return ok(
        `CHECKOUT READY\n\n` +
        `Package:     ${pkg} — ${session.credits_to_add} credits\n` +
        `Equivalent:  ~${minutesStandard} min Standard  /  ~${minutesChirp} min Chirp\n\n` +
        `Open this URL to pay:\n${session.url}\n\n` +
        `Credits will be added to your balance automatically once payment is confirmed.`
      );
    }
  );
}

const ok  = (text: string) => ({ content: [{ type: 'text' as const, text }] });
const err = (text: string) => ({ content: [{ type: 'text' as const, text: `ERROR: ${text}` }] });
