import { supabase } from '../config/supabase';
import { TranscriptionModel } from '../types';

export async function logUsage(params: {
  userId: string;
  model: TranscriptionModel;
  duration_seconds: number;
  credits_charged: number;
}): Promise<void> {
  const { error } = await supabase.from('usage_logs').insert({
    user_id: params.userId,
    model: params.model,
    duration_seconds: params.duration_seconds,
    credits_charged: params.credits_charged,
  });

  if (error) {
    // Non-fatal: log but don't fail the transcription response
    console.error('[usageService] Failed to log usage:', error.message);
  }
}

export async function getUsageHistory(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ items: any[]; total: number }> {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('usage_logs')
    .select('id, created_at, duration_seconds, credits_charged, model', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch usage: ${error.message}`);

  return {
    items: data ?? [],
    total: count ?? 0,
  };
}
