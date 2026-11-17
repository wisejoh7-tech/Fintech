import { prisma } from '../config/db';

export class PersonalFinanceService {
  static async setBudget(userId: string, category: string, limit: number) {
    const minorUnitsLimit = BigInt(Math.round(limit * 100));

    return await prisma.budget.upsert({
      where: {
        userId_category: { userId, category }
      },
      update: { limit: minorUnitsLimit },
      create: { userId, category, limit: minorUnitsLimit }
    });
  }

  static async getAnalytics(userId: string) {
    // 1. Get all successful outgoing transactions for the current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        senderAccount: { userId },
        status: 'SUCCESS',
        createdAt: { gte: firstDay }
      },
      select: {
        category: true,
        amount: true
      }
    });

    // 2. Group by category
    const totals: Record<string, number> = {};
    transactions.forEach(tx => {
      const amount = Number(tx.amount) / 100;
      totals[tx.category] = (totals[tx.category] || 0) + amount;
    });

    return Object.entries(totals).map(([category, amount]) => ({
      category,
      amount
    }));
  }

  static async getBudgets(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId }
    });
    return budgets.map(b => ({
      category: b.category,
      limit: Number(b.limit) / 100
    }));
  }
}
