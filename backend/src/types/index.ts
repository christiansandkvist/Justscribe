export type TranscriptionModel = 'standard' | 'chirp';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
  };
}

export interface TranscriptionResult {
  transcript: string;
  duration_seconds: number;
  credits_charged: number;
  new_balance: number;
}

export interface BalanceResponse {
  balance_credits: number;
  balance_usd_display: string;
}

export interface PricingConfig {
  model: TranscriptionModel;
  credits_per_second: number;
  usd_per_credit: number;
}

export interface UsageLogEntry {
  id: string;
  created_at: string;
  duration_seconds: number;
  credits_charged: number;
  model: TranscriptionModel;
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super('INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}

export class UnsupportedFormatError extends Error {
  constructor(format: string) {
    super(`Unsupported audio format: ${format}`);
    this.name = 'UnsupportedFormatError';
  }
}
