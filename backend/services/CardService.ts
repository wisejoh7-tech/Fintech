import { prisma } from "../config/db";
import { SecurityService } from "./SecurityService";

export class CardService {
  static async createCard(userId: string, type: string, color: string) {
    const FEE = 100000n; // ₦1,000 in kobo

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { accounts: true }
      });

      if (!user || user.accounts.length === 0) throw new Error("Account not found");
      const account = user.accounts[0];

      if (account.balance < FEE) throw new Error("Insufficient balance for card issuance");

      // 1. Deduct Fee
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: FEE } }
      });

      // 2. Generate Card Details
      const pan = "4290" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const cvv = Math.floor(100 + Math.random() * 900).toString();
      const expiry = "09/28";

      // 3. Create Card Record
      const card = await tx.card.create({
        data: {
          accountId: account.id,
          type: type || "Virtual Card",
          last4: pan.slice(-4),
          pan: SecurityService.encrypt(pan),
          expiry: expiry,
          cvv: SecurityService.encrypt(cvv),
          cardName: user.name.toUpperCase(),
          color: color || "bg-slate-900",
          status: 'ACTIVE'
        }
      });

      // 4. Record Transaction
      await tx.transaction.create({
        data: {
          amount: FEE,
          type: 'BILL_PAYMENT',
          status: 'SUCCESS',
          reference: `CRD-${Date.now()}`,
          description: `Virtual Card Issuance Fee (${type})`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      // 5. Create Ledger Entry
      await tx.ledger.create({
        data: {
          accountId: account.id,
          amount: -FEE,
          balance: updatedAccount.balance,
          reason: "Card Issuance Fee"
        }
      });

      return card;
    });
  }

  static async getCards(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: { include: { cards: true } } }
    });
    return user?.accounts.flatMap(acc => acc.cards) || [];
  }

  static async getCardDetails(cardId: string) {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return null;
    return {
      pan: SecurityService.decrypt(card.pan),
      cvv: SecurityService.decrypt(card.cvv)
    };
  }

  static async updateCardStatus(cardId: string, status: string) {
    return await prisma.card.update({
      where: { id: cardId },
      data: { status: status.toUpperCase() as any }
    });
  }
}
