import { supabase } from '../config/supabase';
import { TranscriptionModel, PricingConfig } from '../types';

// Fallback defaults if DB not seeded yet
const DEFAULTS: Record<TranscriptionModel, PricingConfig> = {
  standard: { model: 'standard', credits_per_second: 0.0533, usd_per_credit: 0.01 },
  chirp: { model: 'chirp', credits_per_second: 0.0133, usd_per_credit: 0.01 },
};

export async function getPricingConfig(model: TranscriptionModel): Promise<PricingConfig> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('model, credits_per_second, usd_per_credit')
    .eq('model', model)
    .eq('active', true)
    .single();

  if (error || !data) {
    console.warn(`[pricing] Using default pricing for ${model}`);
    return DEFAULTS[model];
  }

  return {
    model: data.model as TranscriptionModel,
    credits_per_second: Number(data.credits_per_second),
    usd_per_credit: Number(data.usd_per_credit),
  };
}

export async function getAllPricing(): Promise<PricingConfig[]> {
  const { data, error } = await supabase
    .from('pricing_config')
    .select('model, credits_per_second, usd_per_credit')
    .eq('active', true);

  if (error || !data) return Object.values(DEFAULTS);

  return data.map((row) => ({
    model: row.model as TranscriptionModel,
    credits_per_second: Number(row.credits_per_second),
    usd_per_credit: Number(row.usd_per_credit),
  }));
}
