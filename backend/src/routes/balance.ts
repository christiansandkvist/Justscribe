import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { getBalance, formatBalanceDisplay } from '../services/balanceService';
import { getAllPricing } from '../services/pricingService';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const [credits, pricing] = await Promise.all([
      getBalance(userId),
      getAllPricing(),
    ]);

    res.json({
      balance_credits: credits,
      balance_usd_display: formatBalanceDisplay(credits),
      pricing,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
