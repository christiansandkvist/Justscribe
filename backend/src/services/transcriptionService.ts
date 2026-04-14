import fs from 'fs';
import { TranscriptionResult } from '../types';
import { transcribeFile } from './whisperService';
import { deductBalance, getBalance } from './balanceService';
import { logUsage } from './usageService';
import { getPricingConfig } from './pricingService';

export async function runTranscription(params: {
  userId: string;
  filePath: string;
  languageCode?: string;
}): Promise<TranscriptionResult> {
  const { userId, filePath } = params;

  // Preflight: check balance has something (exact check happens after transcription)
  const currentBalance = await getBalance(userId);
  if (currentBalance <= 0) {
    fs.unlinkSync(filePath);
    throw Object.assign(new Error('INSUFFICIENT_BALANCE'), { name: 'InsufficientBalanceError' });
  }

  let sttResult;
  try {
    sttResult = await transcribeFile(filePath);
  } catch (transcribeErr: any) {
    console.error('[transcription] transcribeFile failed:', {
      name: transcribeErr?.name,
      message: transcribeErr?.message,
      status: transcribeErr?.status,
      stack: transcribeErr?.stack?.split('\n').slice(0, 3).join(' | '),
    });
    throw transcribeErr;
  } finally {
    // Always delete temp file, even on error
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File already gone or never existed — ignore
    }
  }

  const pricing = await getPricingConfig('whisper');
  const credits_charged = Math.ceil(sttResult.duration_seconds * pricing.credits_per_second * 100) / 100;

  // Atomic deduction — throws InsufficientBalanceError if not enough credits
  const new_balance = await deductBalance(userId, credits_charged);

  // Non-blocking usage log
  logUsage({
    userId,
    model: 'whisper',
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
