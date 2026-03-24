import { supabase } from '../config/supabase.js';

export interface BalanceInfo {
  credits: number;
  usd_display: string;
  credits_per_second: { standard: number; chirp: number };
}

export async function getBalance(userId: string): Promise<BalanceInfo> {
  const { data, error } = await supabase
    .from('balances')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`Balance lookup failed: ${error.message}`);

  const credits = Number(data?.credits ?? 0);
  return {
    credits,
    usd_display: `$${(credits * 0.01).toFixed(2)}`,
    credits_per_second: { standard: 0.004, chirp: 0.0168 },
  };
}

export async function deductBalance(userId: string, credits: number): Promise<number> {
  const { data, error } = await supabase.rpc('deduct_balance', {
    p_user_id: userId,
    p_credits: credits,
  });

  if (error) {
    if (error.message?.includes('INSUFFICIENT_BALANCE')) {
      throw new Error('Insufficient balance. Use top_up_balance to add credits.');
    }
    throw new Error(`Deduction failed: ${error.message}`);
  }

  return Number(data);
}

export function creditsForSeconds(seconds: number, model: 'standard' | 'chirp'): number {
  const rate = model === 'chirp' ? 0.0168 : 0.004;
  return Math.ceil(seconds * rate * 100) / 100;
}

export function formatCost(credits: number): string {
  return `$${(credits * 0.01).toFixed(4)} (${credits.toFixed(2)} credits)`;
}
