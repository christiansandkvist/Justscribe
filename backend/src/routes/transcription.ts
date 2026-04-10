import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { runTranscription } from '../services/transcriptionService';
import { UnsupportedFormatError } from '../types';

const router = Router();

const bodySchema = z.object({
  language: z.string().default('en-US'),
});

async function handleTranscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file provided' });
    return;
  }

  if (req.file.originalname && !req.file.path) {
    next(new UnsupportedFormatError(req.file.originalname));
    return;
  }

  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const userId = (req as any).user.id;

    const result = await runTranscription({
      userId,
      filePath: req.file.path,
      languageCode: parsed.data.language,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/transcribe/file — uploaded audio file
router.post('/file', requireAuth, upload.single('file'), handleTranscription);

// POST /api/transcribe/stream — recorded audio blob (same pipeline, semantic alias)
router.post('/stream', requireAuth, upload.single('file'), handleTranscription);

export default router;
