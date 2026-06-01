import { prisma } from "../config/db";

export class ScheduledPaymentService {
  static async getScheduled(userId: string) {
    return await prisma.scheduledPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async schedule(userId: string, data: { amount: number, receiver: string, frequency: string, description: string, startDate: string }) {
    return await prisma.scheduledPayment.create({
      data: {
        userId,
        amount: BigInt(Math.round(data.amount * 100)),
        receiver: data.receiver,
        frequency: data.frequency,
        description: data.description,
        nextRun: new Date(data.startDate)
      }
    });
  }

  static async delete(userId: string, id: string) {
    return await prisma.scheduledPayment.delete({
      where: { id, userId }
    });
  }
}
