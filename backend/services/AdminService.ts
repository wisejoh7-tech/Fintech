import { prisma } from "../config/db";
import { ActivityService } from "./ActivityService";
import { CacheService } from "./CacheService";

export class AdminService {
  static async getStats() {
    const cacheKey = "admin:stats";
    const cachedStats = await CacheService.get(cacheKey);
    if (cachedStats) return cachedStats;

    const [totalUsers, totalTransactions, transactions] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.transaction.findMany({ select: { amount: true } })
    ]);
    const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / 100;
    const recentActivity = await ActivityService.getRecent();

    const stats = { totalUsers, totalTransactions, totalVolume, recentActivity };
    await CacheService.set(cacheKey, stats, 300); // Cache for 5 minutes
    return stats;
  }

  static async getUsers() {
    const users = await prisma.user.findMany({
      include: { accounts: true },
      orderBy: { createdAt: 'desc' }
    });
    return users.map(u => ({
      ...u,
      balance: Number(u.accounts[0]?.balance || 0n) / 100
    }));
  }

  static async promoteUser(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' }
    });
  }

  static async updateRiskLevel(userId: string, riskLevel: string) {
    return await (prisma.user as any).update({
      where: { id: userId },
      data: { riskLevel: riskLevel }
    });
  }
}
