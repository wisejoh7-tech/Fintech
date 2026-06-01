import { prisma } from '../config/db';
import { captureFinanceError } from '../monitoring/Sentry';
import { NotificationService } from './NotificationService';
import { PaymentGatewayService } from './PaymentGatewayService';
import { RewardService } from './RewardService';

export class TransferProcessor {
  static async processTransfer(data: {
    senderId: string;
    receiverId: string;
    amount: number;
    reference: string;
    bank?: string;
    bankCode?: string;
  }) {
    const { senderId, receiverId, amount, reference, bank, bankCode } = data;
    const koboAmount = BigInt(Math.round(amount * 100));
    const isExternal = bank && bank !== 'Viva';

    console.log(`[Processor] Handling transfer: ${reference} | Amount: ${amount} | Bank: ${bank || 'Viva'}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Get and lock sender account
        const senderAccount = await tx.account.findFirst({
          where: { userId: senderId },
        });

        if (!senderAccount || senderAccount.balance < koboAmount) {
          throw new Error('Insufficient balance or account not found');
        }

        // 2. Handle Receiver (Internal vs External)
        let receiverAccountId: string | null = null;
        let description = `Transfer to ${receiverId}`;

        if (!isExternal) {
          // Internal Viva-to-Viva
          const receiverAccount = await tx.account.findFirst({
            where: { userId: receiverId },
          });

          if (!receiverAccount) {
            throw new Error('Viva receiver account not found');
          }

          receiverAccountId = receiverAccount.id;
          description = `Viva Transfer to ${receiverAccount.accountNumber}`;

          // Credit internal receiver
          await tx.account.update({
            where: { id: receiverAccount.id },
            data: { balance: { increment: koboAmount } }
          });

          // Ledger for receiver
          await tx.ledger.create({
            data: {
              accountId: receiverAccount.id,
              amount: koboAmount,
              balance: receiverAccount.balance + koboAmount,
              reason: `Incoming transfer from ${senderAccount.accountNumber}`
            }
          });
        } else {
          // External Bank Transfer logic (Gateway)
          // We don't credit any internal account, money leaves the ecosystem
          description = `Transfer to ${receiverId} (${bank})`;

          await PaymentGatewayService.initiateTransfer({
            accountNumber: receiverId,
            bankCode: bankCode || '000',
            amount,
            reference
          });
        }

        // 3. Update Sender balance
        const updatedSender = await tx.account.update({
          where: { id: senderAccount.id },
          data: { balance: { decrement: koboAmount } }
        });

        // 4. Create Transaction Record
        await tx.transaction.create({
          data: {
            amount: koboAmount,
            type: 'TRANSFER',
            status: 'SUCCESS',
            reference: reference,
            description,
            senderAccountId: senderAccount.id,
            receiverAccountId: receiverAccountId,
            processedAt: new Date(),
          }
        });

        // 5. Create Ledger Entry for Sender
        await tx.ledger.create({
          data: {
            accountId: senderAccount.id,
            amount: -koboAmount,
            balance: updatedSender.balance,
            reason: description
          }
        });
      });

      // 6. Award Cashback
      await RewardService.awardCashback(senderId, amount).catch(() => {});

      // 7. Send Notifications
      await NotificationService.sendPush(
        senderId,
        'Debit Alert',
        `Successfully sent ₦${amount.toLocaleString()} to ${receiverId} (${bank || 'Viva'}).`
      );

      if (!isExternal) {
        // Only notify receiver if they are in our system
        const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
        await NotificationService.sendPush(
          receiverId,
          'Credit Alert',
          `You received ₦${amount.toLocaleString()} from ${sender?.name || 'Viva User'}.`
        ).catch(() => {});
      }

      console.log(`[Processor] Transfer successful: ${reference}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Processor] Transfer failed: ${reference}`, error);

      captureFinanceError(error, { reference, senderId, receiverId, amount });

      await prisma.transaction.update({
        where: { reference: reference },
        data: { status: 'FAILED', metadata: { error: error.message } }
      }).catch(() => {});

      throw error;
    }
  }
}

