import { prisma } from '../config/db';

export class RewardService {
  /**
   * Award cashback on successful transactions
   */
  static async awardCashback(userId: string, amount: number) {
    const cashbackRate = 0.005; // 0.5% for business accounts
    const reward = BigInt(Math.round(amount * cashbackRate * 100));

    if (reward <= 0n) return;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { rewardBalance: { increment: reward } }
      });
      console.log(`[Reward] Awarded ₦${Number(reward)/100} cashback to user ${userId}`);
    } catch (err) {
      console.error("Failed to award cashback", err);
    }
  }

  static async getRewardBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rewardBalance: true }
    });
    return user?.rewardBalance || 0n;
  }

  static async getReferralStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, rewardBalance: true }
    });
    return user;
  }
}
