import fs from 'fs';
import { TranscriptionModel, TranscriptionResult } from '../types';
import { transcribeFile } from './googleSttService';
import { deductBalance, getBalance } from './balanceService';
import { logUsage } from './usageService';
import { getPricingConfig } from './pricingService';

export async function runTranscription(params: {
  userId: string;
  filePath: string;
  model: TranscriptionModel;
  languageCode?: string;
}): Promise<TranscriptionResult> {
  const { userId, filePath, model, languageCode = 'en-US' } = params;

  // Preflight: check balance has something (exact check happens after GCP)
  const currentBalance = await getBalance(userId);
  if (currentBalance <= 0) {
    fs.unlinkSync(filePath);
    throw Object.assign(new Error('INSUFFICIENT_BALANCE'), { name: 'InsufficientBalanceError' });
  }

  let sttResult;
  try {
    sttResult = await transcribeFile(filePath, model, languageCode);
  } finally {
    // Always delete temp file, even on GCP error
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File already gone or never existed — ignore
    }
  }

  const pricing = await getPricingConfig(model);
  const credits_charged = Math.ceil(sttResult.duration_seconds * pricing.credits_per_second * 100) / 100;

  // Atomic deduction — throws InsufficientBalanceError if not enough credits
  const new_balance = await deductBalance(userId, credits_charged);

  // Non-blocking usage log
  logUsage({
    userId,
    model,
    duration_seconds: sttResult.duration_seconds,
    credits_charged,
  });

  return {
    transcript: sttResult.transcript,
    duration_seconds: sttResult.duration_seconds,
    credits_charged,
    new_balance,
  };
}
