import { prisma } from "../config/db";
import { queueTransaction } from "../queues/TransferQueue";
import { SecurityService } from "./SecurityService";

export class TransferService {
  static async initiateTransfer(userId: string, data: {
    receiver: string,
    amount: number,
    bank?: string,
    bankCode?: string,
    pin: string,
    reference?: string,
    senderAccountId?: string
  }) {
    const { receiver, amount, bank, bankCode, pin, reference, senderAccountId } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user || !user.transactionPin || !SecurityService.verifyPassword(pin, user.transactionPin)) {
      throw new Error("Invalid transaction PIN");
    }

    const account = senderAccountId ? user.accounts.find(a => a.id === senderAccountId) : user.accounts[0];
    if (!account || Number(account.balance) < amount * 100) {
      throw new Error("Insufficient balance");
    }

    const txRef = reference || `VIVA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await queueTransaction({
      senderId: user.id,
      receiverId: receiver,
      amount,
      type: 'TRANSFER',
      reference: txRef,
      bank,
      bankCode
    });

    return { success: true, reference: txRef };
  }

  static async initiateBulkTransfer(userId: string, data: {
    recipients: any[],
    pin: string
  }) {
    const { recipients, pin } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user || !user.transactionPin || !SecurityService.verifyPassword(pin, user.transactionPin)) {
      throw new Error("Invalid transaction PIN");
    }

    const totalAmount = recipients.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
    if (Number(user.accounts[0].balance) < totalAmount * 100) {
      throw new Error("Insufficient balance for bulk transfer");
    }

    const batchRef = `BULK-${Date.now()}`;
    for (const recipient of recipients) {
      await queueTransaction({
        senderId: user.id,
        receiverId: recipient.accountNumber,
        amount: parseFloat(recipient.amount),
        type: 'BULK_TRANSFER',
        reference: `${batchRef}-${Math.random().toString(36).substring(7)}`,
        bank: recipient.bank,
        bankCode: recipient.bankCode
      });
    }

    return { success: true, message: `Processing ${recipients.length} transfers` };
  }
}
