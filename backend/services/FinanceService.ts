import { prisma } from "../config/db";
import { SecurityService } from "./SecurityService";

export class FinanceService {
  static async withdraw(userId: string, data: { amount: number, bankName: string, accountNumber: string, accountName: string }) {
    const koboAmount = BigInt(Math.round(data.amount * 100));

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { accounts: true } });
      const account = user?.accounts[0];
      if (!account || account.balance < koboAmount) throw new Error("Insufficient balance");

      const updated = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: koboAmount } }
      });

      await tx.transaction.create({
        data: {
          amount: koboAmount,
          type: 'WITHDRAWAL',
          status: 'SUCCESS',
          reference: `WDR-${Date.now()}`,
          description: `Withdrawal to ${data.bankName} / ${data.accountNumber}`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: -koboAmount,
          balance: updated.balance,
          reason: `Withdrawal to ${data.accountName}`
        }
      });

      return { success: true };
    });
  }

  static async invest(userId: string, data: { type: string, amount: number, pin: string }) {
    const koboAmount = BigInt(Math.round(data.amount * 100));

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { accounts: true } });
      if (!user || !SecurityService.verifyPassword(data.pin, user.transactionPin!)) throw new Error("Invalid PIN");

      const account = user.accounts[0];
      if (!account || account.balance < koboAmount) throw new Error("Insufficient balance");

      const updated = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: koboAmount } }
      });

      await tx.transaction.create({
        data: {
          amount: koboAmount,
          type: 'INVESTMENT',
          status: 'SUCCESS',
          reference: `INV-${Date.now()}`,
          description: `Investment: ${data.type}`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: -koboAmount,
          balance: updated.balance,
          reason: `Investment: ${data.type}`
        }
      });

      return { success: true };
    });
  }

  static async scanPay(userId: string, data: { merchantId: string, amount: number, pin: string }) {
    const koboAmount = BigInt(Math.round(data.amount * 100));

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { accounts: true } });
      if (!user || !SecurityService.verifyPassword(data.pin, user.transactionPin!)) throw new Error("Invalid PIN");

      const account = user.accounts[0];
      if (!account || account.balance < koboAmount) throw new Error("Insufficient balance");

      const updated = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: koboAmount } }
      });

      await tx.transaction.create({
        data: {
          amount: koboAmount,
          type: 'TRANSFER',
          status: 'SUCCESS',
          reference: `SCAN-${Date.now()}`,
          description: `QR Payment to Merchant: ${data.merchantId}`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: -koboAmount,
          balance: updated.balance,
          reason: `Scan & Pay: ${data.merchantId}`
        }
      });

      return { success: true };
    });
  }

  static async applyReferral(userId: string, code: string) {
    const BONUS = 50000n; // ₦500 bonus

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const referrer = await tx.user.findUnique({ where: { referralCode: code } });

      if (!user || !referrer || user.referredBy || user.id === referrer.id) {
        throw new Error("Invalid referral code or already referred");
      }

      await tx.user.update({
        where: { id: user.id },
        data: { referredBy: referrer.id, rewardBalance: { increment: BONUS } }
      });

      await tx.user.update({
        where: { id: referrer.id },
        data: { rewardBalance: { increment: BONUS } }
      });

      return { success: true };
    });
  }
}
