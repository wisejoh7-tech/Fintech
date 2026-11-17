import { prisma } from "../config/db";
import { queueTransaction } from "../queues/TransferQueue";
import { SecurityService } from "./SecurityService";

export class ApprovalService {
  static async getPendingApprovals(userId: string) {
    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
        // For non-admins, maybe they can see approvals *they* initiated?
        // But usually approvals are for admins to review.
    }

    return await prisma.transaction.findMany({
      where: {
        status: 'AWAITING_APPROVAL'
      },
      include: {
        senderAccount: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async approveTransaction(adminId: string, transactionId: string, pin: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin || admin.role !== 'ADMIN' || !admin.transactionPin || !SecurityService.verifyPassword(pin, admin.transactionPin)) {
      throw new Error("Unauthorized or Invalid Admin PIN");
    }

    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { senderAccount: true }
    });

    if (!tx || tx.status !== 'AWAITING_APPROVAL') {
      throw new Error("Invalid or already processed transaction");
    }

    // 1. Mark as PENDING (ready for queue)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'PENDING',
        approverId: adminId
      }
    });

    // 2. Queue for actual movement of funds
    await queueTransaction({
      senderId: tx.senderAccount?.userId!,
      receiverId: tx.receiverAccountId || "",
      amount: Number(tx.amount) / 100,
      type: tx.type,
      reference: tx.reference,
      bank: (tx.metadata as any)?.bank,
      bankCode: (tx.metadata as any)?.bankCode
    });

    return { success: true };
  }

  static async declineTransaction(adminId: string, transactionId: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'ADMIN') throw new Error("Access denied");

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'DECLINED',
        approverId: adminId
      }
    });
  }
}
