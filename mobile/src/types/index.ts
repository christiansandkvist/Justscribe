export type TranscriptionModel = 'standard' | 'chirp';

export interface BalanceState {
  balance_credits: number;
  balance_usd_display: string;
  pricing: PricingConfig[];
}

export interface PricingConfig {
  model: TranscriptionModel;
  credits_per_second: number;
  usd_per_credit: number;
}

export interface TranscriptionResult {
  transcript: string;
  duration_seconds: number;
  credits_charged: number;
  new_balance: number;
}

export interface UsageLogEntry {
  id: string;
  created_at: string;
  duration_seconds: number;
  credits_charged: number;
  model: TranscriptionModel;
}

export interface TopUpPackage {
  label: string;
  amount_usd_cents: number;
  credits: number;
  bonus_pct?: number;
}

// Navigation params
export type RootStackParamList = {
  '(app)/home': undefined;
  '(app)/choose-speed': {
    source: 'record' | 'file';
    fileUri?: string;
    fileDurationSeconds?: number;
  };
  '(app)/record': {
    model: TranscriptionModel;
  };
  '(app)/processing': {
    fileUri: string;
    model: TranscriptionModel;
    durationSeconds: number;
  };
  '(app)/result': {
    transcript: string;
    duration_seconds: number;
    credits_charged: number;
    new_balance: number;
  };
};
