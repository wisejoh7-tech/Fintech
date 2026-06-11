import { prisma } from "../config/db";
import { queueTransaction } from "../queues/TransferQueue";
import { SecurityService } from "./SecurityService";

export class PayrollService {
  /**
   * Creates a new payroll batch but does not process it yet.
   */
  static async createBatch(companyId: string, data: { title: string, employees: any[] }) {
    const totalAmount = data.employees.reduce((sum, emp) => sum + BigInt(Math.round(emp.amount * 100)), 0n);

    return await prisma.payrollBatch.create({
      data: {
        companyId,
        title: data.title,
        totalAmount,
        items: data.employees,
        status: 'PENDING'
      }
    });
  }

  /**
   * Processes a payroll batch by queuing all individual transfers.
   */
  static async processBatch(companyId: string, batchId: string, pin: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify User & PIN
      const user = await tx.user.findUnique({
        where: { id: companyId },
        include: { accounts: true }
      });

      if (!user || !user.transactionPin || !SecurityService.verifyPassword(pin, user.transactionPin)) {
        throw new Error("Invalid transaction PIN");
      }

      // 2. Get Batch
      const batch = await (tx.payrollBatch as any).findUnique({
        where: { id: batchId, companyId }
      });

      if (!batch || batch.status !== 'PENDING') {
        throw new Error("Batch not found or already processed");
      }

      // 3. Check Balance
      const account = user.accounts[0];
      if (!account || account.balance < batch.totalAmount) {
        throw new Error("Insufficient balance to process payroll");
      }

      // 4. Update Batch Status
      await (tx.payrollBatch as any).update({
        where: { id: batchId },
        data: { status: 'PROCESSING', processedAt: new Date() }
      });

      // 5. Queue Transfers
      const employees = batch.items as any[];
      for (const emp of employees) {
        await queueTransaction({
          senderId: companyId,
          receiverId: emp.accountNumber,
          amount: emp.amount,
          type: 'BULK_TRANSFER',
          reference: `PAYROLL-${batchId}-${emp.accountNumber}-${Date.now()}`,
          bank: emp.bank,
          bankCode: emp.bankCode
        });
      }

      return { success: true, count: employees.length };
    });
  }

  static async getBatches(companyId: string) {
    return await prisma.payrollBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
