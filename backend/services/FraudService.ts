import { prisma } from "../config/db";

export class FraudService {
  /**
   * Evaluates a transaction for potential fraud.
   * Returns a risk score from 0 to 100.
   */
  static async evaluateTransaction(userId: string, amount: number) {
    let riskScore = 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user) return 100; // Unknown user is high risk

    // 1. Velocity Check: Too many transactions in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentTxCount = await prisma.transaction.count({
      where: {
        senderAccountId: user.accounts[0]?.id,
        createdAt: { gte: tenMinutesAgo }
      }
    });

    if (recentTxCount > 5) riskScore += 40;
    if (recentTxCount > 10) riskScore += 30;

    // 2. High Value Check: Transaction amount relative to user tier
    const amountNaira = amount;
    if (user.tier === 1 && amountNaira > 50000) riskScore += 20;
    if (user.tier === 1 && amountNaira > 200000) riskScore += 30;
    if (user.tier === 2 && amountNaira > 1000000) riskScore += 20;

    // 3. Balance Drain Check: If transaction is > 90% of total balance
    const balance = Number(user.accounts[0]?.balance || 0n) / 100;
    if (amountNaira > balance * 0.9) riskScore += 15;

    // 4. Time of Day Check: Late night transactions (1 AM - 4 AM)
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 4) riskScore += 10;

    // 5. Historical Average Check
    const history = await prisma.transaction.aggregate({
      where: { senderAccountId: user.accounts[0]?.id },
      _avg: { amount: true }
    });
    const avgAmount = Number(history._avg.amount || 0n) / 100;
    if (avgAmount > 0 && amountNaira > avgAmount * 10) riskScore += 25;

    return Math.min(riskScore, 100);
  }

  /**
   * Flags a user for suspicious activity
   */
  static async flagUser(userId: string, reason: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        riskLevel: 'HIGH',
        metadata: {
          fraud_flag: {
            reason,
            flaggedAt: new Date()
          }
        }
      }
    });
  }
}
