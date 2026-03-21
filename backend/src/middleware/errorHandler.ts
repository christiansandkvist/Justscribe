import { Request, Response, NextFunction } from 'express';
import { InsufficientBalanceError, UnsupportedFormatError } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof InsufficientBalanceError) {
    res.status(402).json({
      error: 'insufficient_balance',
      message: 'Top up your balance to continue transcribing.',
    });
    return;
  }

  if (err instanceof UnsupportedFormatError) {
    res.status(422).json({
      error: 'unsupported_format',
      message: err.message,
    });
    return;
  }

  // Multer file size exceeded
  if (err.name === 'MulterError' && (err as any).code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'file_too_large',
      message: 'File exceeds 500 MB limit.',
    });
    return;
  }

  // GCP quota error
  if (err.message?.includes('RESOURCE_EXHAUSTED')) {
    res.status(503).json({
      error: 'service_unavailable',
      message: 'Transcription service is temporarily overloaded. Please try again.',
    });
    return;
  }

  res.status(500).json({
    error: 'internal_error',
    message: 'Something went wrong. Please try again.',
  });
}
