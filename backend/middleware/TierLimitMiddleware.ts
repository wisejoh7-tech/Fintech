import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

const TIER_LIMITS: Record<number, number> = {
  1: 50000,   // Tier 1: 50k max per transaction
  2: 500000,  // Tier 2: 500k max
  3: 10000000 // Tier 3: 10M max
};

export const checkTierLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const amount = parseFloat(req.body.amount);

    if (!userId || isNaN(amount)) return next();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const limit = TIER_LIMITS[user.tier] || 50000;

    if (amount > limit) {
      return res.status(403).json({
        error: `Transaction exceeds your Tier ${user.tier} limit of ₦${limit.toLocaleString()}. Please upgrade your KYC.`
      });
    }

    next();
  } catch (error) {
    next();
  }
};
