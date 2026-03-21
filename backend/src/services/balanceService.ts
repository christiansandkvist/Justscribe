import { supabase } from '../config/supabase';
import { InsufficientBalanceError } from '../types';

export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('balances')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch balance: ${error.message}`);
  return Number(data?.credits ?? 0);
}

export async function deductBalance(
  userId: string,
  credits: number
): Promise<number> {
  const { data, error } = await supabase.rpc('deduct_balance', {
    p_user_id: userId,
    p_credits: credits,
  });

  if (error) {
    if (error.message?.includes('INSUFFICIENT_BALANCE')) {
      throw new InsufficientBalanceError();
    }
    throw new Error(`Balance deduction failed: ${error.message}`);
  }

  return Number(data);
}

export async function topUpBalance(
  userId: string,
  credits: number
): Promise<number> {
  const { data, error } = await supabase.rpc('top_up_balance', {
    p_user_id: userId,
    p_credits: credits,
  });

  if (error) throw new Error(`Top-up failed: ${error.message}`);
  return Number(data);
}

export function formatBalanceDisplay(credits: number): string {
  // 1 credit = $0.01 USD
  const usd = credits * 0.01;
  return `$${usd.toFixed(2)}`;
}
