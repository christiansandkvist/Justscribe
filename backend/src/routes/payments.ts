import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { createPaymentIntent, handleWebhookEvent } from '../services/stripeService';

const router = Router();

const createIntentSchema = z.object({
  amount_usd_cents: z.number().int().min(500, 'Minimum top-up is $5.00'),
});

// POST /api/payments/create-intent
router.post('/create-intent', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createIntentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const user = (req as any).user;
    const result = await createPaymentIntent({
      userId: user.id,
      email: user.email,
      amount_usd_cents: parsed.data.amount_usd_cents,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook — Stripe sends events here
// IMPORTANT: must use raw body — registered in index.ts before json middleware
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    await handleWebhookEvent(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err: any) {
    console.error('[webhook]', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
