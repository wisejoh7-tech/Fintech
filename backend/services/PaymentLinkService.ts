import { prisma } from "../config/db";
import crypto from 'crypto';

export class PaymentLinkService {
  static async getLinks(userId: string) {
    return await prisma.paymentLink.findMany({
      where: { userId }
    });
  }

  static async createLink(userId: string, data: { title: string, description: string, amount?: number }) {
    return await prisma.paymentLink.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        amount: data.amount ? BigInt(Math.round(data.amount * 100)) : null,
        linkId: crypto.randomBytes(4).toString('hex')
      }
    });
  }
}
