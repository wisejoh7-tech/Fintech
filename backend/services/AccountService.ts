import { prisma } from '../config/db';
import { NotificationService } from './NotificationService';

export class AccountService {
  static async getAccounts(userId: string) {
    return await prisma.account.findMany({ where: { userId } });
  }

  static async createAccount(userId: string, currency: string) {
    return await prisma.account.create({
      data: {
        userId,
        accountNumber: "0" + Math.floor(Math.random() * 900000000).toString(),
        currency,
        balance: 0n
      }
    });
  }

  /**
   * Credit a user's account (Deposit, Incoming Transfer, etc.)
   */
  static async creditAccount(params: {
    userId?: string;
    accountNumber?: string;
    email?: string;
    amount: number; // In Naira/Base currency
    reference: string;
    description: string;
    type: 'DEPOSIT' | 'TRANSFER';
  }) {
    const { userId, accountNumber, email, amount, reference, description, type } = params;
    const koboAmount = BigInt(Math.round(amount * 100));

    return await prisma.$transaction(async (tx) => {
      // 1. Find the account
      let account;
      if (userId) {
        account = await tx.account.findFirst({ where: { userId }, include: { user: true } });
      } else if (accountNumber) {
        account = await tx.account.findUnique({ where: { accountNumber }, include: { user: true } });
      } else if (email) {
        account = await tx.account.findFirst({ where: { user: { email } }, include: { user: true } });
      }

      if (!account) {
        throw new Error('Account not found');
      }

      // 2. Prevent duplicate processing (Idempotency)
      const existingTx = await tx.transaction.findUnique({
        where: { reference }
      });
      if (existingTx) return existingTx;

      // 3. Update Balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: koboAmount } }
      });

      // 4. Create Transaction Record
      const transaction = await tx.transaction.create({
        data: {
          amount: koboAmount,
          type: type === 'DEPOSIT' ? 'DEPOSIT' : 'TRANSFER',
          status: 'SUCCESS',
          reference,
          description,
          receiverAccountId: account.id,
          processedAt: new Date(),
        }
      });

      // 5. Create Ledger Entry
      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: koboAmount,
          balance: updatedAccount.balance,
          reason: description
        }
      });

      // 6. Notify User
      await NotificationService.sendPush(
        account.userId,
        "Credit Alert",
        `Your account has been credited with ₦${amount.toLocaleString()}. Ref: ${reference}`
      );

      return transaction;
    });
  }
}
