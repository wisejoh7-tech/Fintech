import { prisma } from '../config/db';
import { captureFinanceError } from '../monitoring/Sentry';
import { NotificationService } from './NotificationService';
import { PaymentGatewayService } from './PaymentGatewayService';
import { RewardService } from './RewardService';
import { ExchangeService } from './ExchangeService';

export class TransferProcessor {
  static async processTransfer(data: {
    senderId: string;
    receiverId: string;
    amount: number; // This is the amount the sender wants to send (in their currency)
    reference: string;
    bank?: string;
    bankCode?: string;
  }) {
    const { senderId, receiverId, amount, reference, bank, bankCode } = data;
    const isExternal = bank && bank !== 'Viva';

    console.log(`[Processor] Handling transfer: ${reference} | Amount: ${amount} | Bank: ${bank || 'Viva'}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Get and lock sender account
        const senderAccount = await tx.account.findFirst({
          where: { userId: senderId },
        });

        if (!senderAccount) throw new Error('Sender account not found');

        const koboAmountSender = BigInt(Math.round(amount * 100));
        if (senderAccount.balance < koboAmountSender) {
          throw new Error('Insufficient balance');
        }

        // 2. Handle Receiver (Internal vs External)
        let receiverAccountId: string | null = null;
        let description = `Transfer to ${receiverId}`;
        let creditAmount = amount; // default to same currency

        if (!isExternal) {
          // Internal Viva-to-Viva
          const receiverAccount = await tx.account.findFirst({
            where: { userId: receiverId },
          });

          if (!receiverAccount) {
            throw new Error('Viva receiver account not found');
          }

          receiverAccountId = receiverAccount.id;

          // Currency Conversion if needed
          if (senderAccount.currency !== receiverAccount.currency) {
            creditAmount = ExchangeService.convert(amount, senderAccount.currency, receiverAccount.currency);
            description = `Viva Transfer: ${amount} ${senderAccount.currency} to ${creditAmount.toFixed(2)} ${receiverAccount.currency}`;
          } else {
            description = `Viva Transfer to ${receiverAccount.accountNumber}`;
          }

          const koboAmountReceiver = BigInt(Math.round(creditAmount * 100));

          // Credit internal receiver
          await tx.account.update({
            where: { id: receiverAccount.id },
            data: { balance: { increment: koboAmountReceiver } }
          });

          // Ledger for receiver
          await tx.ledger.create({
            data: {
              accountId: receiverAccount.id,
              amount: koboAmountReceiver,
              balance: receiverAccount.balance + koboAmountReceiver,
              reason: `Incoming transfer from ${senderAccount.accountNumber}`
            }
          });
        } else {
          // External Bank Transfer logic (Gateway)
          // Most Nigerian gateways expect NGN
          const ngnAmount = ExchangeService.convert(amount, senderAccount.currency, 'NGN');
          description = `Transfer to ${receiverId} (${bank})`;

          await PaymentGatewayService.initiateTransfer({
            accountNumber: receiverId,
            bankCode: bankCode || '000',
            amount: ngnAmount,
            reference
          });
        }

        // 3. Update Sender balance
        const updatedSender = await tx.account.update({
          where: { id: senderAccount.id },
          data: { balance: { decrement: koboAmountSender } }
        });

        // 4. Create Transaction Record
        await tx.transaction.create({
          data: {
            amount: koboAmountSender,
            type: 'TRANSFER',
            status: isExternal ? 'PENDING' : 'SUCCESS',
            reference: reference,
            description,
            senderAccountId: senderAccount.id,
            receiverAccountId: receiverAccountId,
            processedAt: isExternal ? null : new Date(),
            metadata: {
              exchangeRate: ExchangeService.getRate(senderAccount.currency),
              sourceCurrency: senderAccount.currency,
              targetAmount: creditAmount
            } as any
          }
        });

        // 5. Create Ledger Entry for Sender
        await tx.ledger.create({
          data: {
            accountId: senderAccount.id,
            amount: -koboAmountSender,
            balance: updatedSender.balance,
            reason: description
          }
        });
      });

      // 6. Award Cashback (only on NGN equivalent)
      const ngnValue = ExchangeService.convert(amount, 'NGN', 'NGN'); // Placeholder if we want to standardize rewards
      await RewardService.awardCashback(senderId, amount).catch(() => {});

      // 7. Send Notifications
      await NotificationService.sendPush(
        senderId,
        'Debit Alert',
        `Successfully sent ${amount} ${senderAccount?.currency || 'NGN'} to ${receiverId} (${bank || 'Viva'}).`,
        { priority: 'high' }
      );

      if (!isExternal) {
        // Only notify receiver if they are in our system
        const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
        await NotificationService.sendPush(
          receiverId,
          'Credit Alert',
          `You received ${creditAmount.toFixed(2)} from ${sender?.name || 'Viva User'}.`,
          { priority: 'high' }
        ).catch(() => {});
      }

      console.log(`[Processor] Transfer successful: ${reference}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Processor] Transfer failed: ${reference}`, error);
      captureFinanceError(error, { reference, senderId, receiverId, amount });

      await prisma.transaction.update({
        where: { reference: reference },
        data: { status: 'FAILED', metadata: { error: error.message } as any }
      }).catch(() => {});
      throw error;
    }
  }
}

