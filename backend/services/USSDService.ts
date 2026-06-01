import { prisma } from "../config/db";
import { queueTransaction } from "../queues/TransferQueue";

export class USSDService {
  static async processRequest(phoneNumber: string, text: string) {
    const parts = text.split('*');

    // Pattern: *819*AMOUNT*ACCOUNT#
    if (parts.length === 4 && parts[1] === '819') {
      const amount = parseFloat(parts[2]);
      const targetAcc = parts[3].replace('#', '');

      try {
        const user = await prisma.user.findFirst({
          where: { phoneNumber },
          include: { accounts: true }
        });

        if (!user || user.accounts.length === 0) return "END Error: User not found";

        const account = user.accounts[0];
        if (Number(account.balance) < amount * 100) return "END Error: Insufficient funds";

        await queueTransaction({
          senderId: user.id,
          receiverId: targetAcc,
          amount,
          type: 'TRANSFER',
          reference: `USSD-${Date.now()}`
        });

        return "END Success: Transfer of NGN " + amount + " to " + targetAcc + " initiated.";
      } catch (err) {
        return "END Error: System failure";
      }
    }

    return "CON Welcome to VIVA Banking\n1. Transfer\n2. Check Balance\n3. My Account Number";
  }
}
