import { prisma } from "../config/db";

export class InvoiceService {
  static async getInvoices(userId: string) {
    return await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createInvoice(userId: string, data: { clientName: string, clientEmail: string, amount: number, dueDate: string, description: string }) {
    return await prisma.invoice.create({
      data: {
        userId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        amount: BigInt(Math.round(data.amount * 100)),
        dueDate: new Date(data.dueDate),
        description: data.description,
        reference: `INV-${Date.now()}`
      }
    });
  }
}
