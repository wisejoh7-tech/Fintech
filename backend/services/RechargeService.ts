import { prisma } from "../config/db";
import { SecurityService } from "./SecurityService";

export class RechargeService {
  static async recharge(userId: string, data: { phoneNumber: string, amount: number, type: string, network: string, pin: string }) {
    const koboAmount = BigInt(Math.round(data.amount * 100));

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { accounts: true }
      });

      if (!user || !user.transactionPin || !SecurityService.verifyPassword(data.pin, user.transactionPin)) {
        throw new Error("Invalid PIN");
      }

      const account = user.accounts[0];
      if (!account || account.balance < koboAmount) throw new Error("Insufficient balance");

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: koboAmount } }
      });

      const transaction = await tx.transaction.create({
        data: {
          amount: koboAmount,
          type: 'BILL_PAYMENT',
          status: 'SUCCESS',
          reference: `RCH-${Date.now()}`,
          description: `${data.type.toUpperCase()} Topup: ${data.network} ${data.phoneNumber}`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: -koboAmount,
          balance: updatedAccount.balance,
          reason: `${data.type} Recharge`
        }
      });

      console.log(`[RechargeProvider] Sending ${data.amount} ${data.type} to ${data.phoneNumber}`);

      return transaction;
    });
  }
}
