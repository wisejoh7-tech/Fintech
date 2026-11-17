import { prisma } from "../config/db";
import { SecurityService } from "./SecurityService";

export class BillService {
  static async payBill(userId: string, data: { biller: string, amount: number, customerId: string, pin: string }) {
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

      // 1. Deduct funds
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: koboAmount } }
      });

      // 2. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: koboAmount,
          type: 'BILL_PAYMENT',
          status: 'SUCCESS',
          reference: `BILL-${Date.now()}`,
          description: `Bill Payment: ${data.biller} (${data.customerId})`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      // 3. Create Ledger
      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: -koboAmount,
          balance: updatedAccount.balance,
          reason: `Bill: ${data.biller}`
        }
      });

      // 4. In a real app, call a provider API here (e.g. Baxi, VTpass)
      console.log(`[BillProvider] Dispatched payment for ${data.biller} - ${data.customerId}`);

      return transaction;
    });
  }
}
