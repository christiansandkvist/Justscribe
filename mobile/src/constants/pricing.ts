import { TopUpPackage, PricingConfig } from '../types';

// Display-only defaults — authoritative values come from GET /api/balance
export const DEFAULT_PRICING: Record<string, PricingConfig> = {
  standard: { model: 'standard', credits_per_second: 0.0533, usd_per_credit: 0.01 },
  chirp: { model: 'chirp', credits_per_second: 0.0133, usd_per_credit: 0.01 },
};

export const TOP_UP_PACKAGES: TopUpPackage[] = [
  { label: '$5', amount_usd_cents: 500, credits: 500 },
  { label: '$10', amount_usd_cents: 1000, credits: 1100, bonus_pct: 10 },
  { label: '$25', amount_usd_cents: 2500, credits: 3000, bonus_pct: 20 },
  { label: '$50', amount_usd_cents: 5000, credits: 7000, bonus_pct: 40 },
];

export function estimateCost(
  durationSeconds: number,
  pricing: PricingConfig
): { credits: number; usd: string } {
  const credits = durationSeconds * pricing.credits_per_second;
  const usd = credits * pricing.usd_per_credit;
  return {
    credits: Math.ceil(credits * 100) / 100,
    usd: `$${usd.toFixed(2)}`,
  };
}

export function creditsToUsd(credits: number): string {
  return `$${(credits * 0.01).toFixed(2)}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
