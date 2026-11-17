import { prisma } from "../config/db";
import { NotificationService } from "./NotificationService";

export class EscrowService {
  /**
   * Buyer creates an escrow agreement.
   */
  static async createEscrow(buyerId: string, data: { sellerEmail: string, amount: number, description: string }) {
    const seller = await prisma.user.findUnique({ where: { email: data.sellerEmail } });
    if (!seller) throw new Error("Seller not found on VIVA. They must register first.");
    if (buyerId === seller.id) throw new Error("You cannot create an escrow with yourself.");

    const koboAmount = BigInt(Math.round(data.amount * 100));
    const fee = BigInt(Math.round(data.amount * 0.01 * 100)); // 1% escrow fee

    return await prisma.escrow.create({
      data: {
        buyerId,
        sellerId: seller.id,
        amount: koboAmount,
        fee,
        description: data.description,
        status: 'AWAITING_FUNDS'
      }
    });
  }

  /**
   * Buyer funds the escrow (Money is moved from Buyer's account to system holding).
   */
  static async fundEscrow(buyerId: string, escrowId: string) {
    return await prisma.$transaction(async (tx) => {
      const escrow = await tx.escrow.findUnique({ where: { id: escrowId, buyerId } });
      if (!escrow || escrow.status !== 'AWAITING_FUNDS') throw new Error("Invalid escrow state");

      const totalToPay = escrow.amount + escrow.fee;

      const buyerAccount = await tx.account.findFirst({ where: { userId: buyerId } });
      if (!buyerAccount || buyerAccount.balance < totalToPay) throw new Error("Insufficient balance");

      // 1. Deduct from Buyer
      await tx.account.update({
        where: { id: buyerAccount.id },
        data: { balance: { decrement: totalToPay } }
      });

      // 2. Mark Escrow as HELD
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'HELD' }
      });

      // 3. Create Ledger Entry
      await tx.ledger.create({
        data: {
          accountId: buyerAccount.id,
          amount: -totalToPay,
          balance: buyerAccount.balance - totalToPay,
          reason: `Escrow Payment: ${escrow.description}`
        }
      });

      // 4. Notify Seller
      await NotificationService.sendPush(escrow.sellerId, "Escrow Funded", `₦${Number(escrow.amount)/100} is now held in escrow for: ${escrow.description}. Deliver goods to receive payment.`);

      return updatedEscrow;
    });
  }

  /**
   * Buyer releases the funds (Money moves from system holding to Seller's account).
   */
  static async releaseEscrow(buyerId: string, escrowId: string) {
    return await prisma.$transaction(async (tx) => {
      const escrow = await tx.escrow.findUnique({ where: { id: escrowId, buyerId } });
      if (!escrow || escrow.status !== 'HELD') throw new Error("Escrow must be in HELD status to release");

      const sellerAccount = await tx.account.findFirst({ where: { userId: escrow.sellerId } });
      if (!sellerAccount) throw new Error("Seller account not found");

      // 1. Credit Seller
      await tx.account.update({
        where: { id: sellerAccount.id },
        data: { balance: { increment: escrow.amount } }
      });

      // 2. Mark Escrow as RELEASED
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'RELEASED', releaseDate: new Date() }
      });

      // 3. Create Ledger Entry for Seller
      await tx.ledger.create({
        data: {
          accountId: sellerAccount.id,
          amount: escrow.amount,
          balance: sellerAccount.balance + escrow.amount,
          reason: `Escrow Release: ${escrow.description}`
        }
      });

      // 4. Notify Seller
      await NotificationService.sendPush(escrow.sellerId, "Funds Released!", `₦${Number(escrow.amount)/100} has been credited to your account for: ${escrow.description}.`);

      return updatedEscrow;
    });
  }

  /**
   * Disputed escrow handling (Requires Admin intervention or mutual agreement).
   */
  static async disputeEscrow(userId: string, escrowId: string, reason: string) {
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow || (escrow.buyerId !== userId && escrow.sellerId !== userId)) throw new Error("Unauthorized");
    if (escrow.status !== 'HELD') throw new Error("Only funded escrows can be disputed");

    return await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'DISPUTED',
        disputeReason: reason
      }
    });
  }

  static async getEscrows(userId: string) {
    return await prisma.escrow.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: { buyer: { select: { name: true, email: true } }, seller: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
