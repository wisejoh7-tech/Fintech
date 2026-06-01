import { prisma } from '../config/db';

export class ActivityService {
  static async log(params: {
    userId: string;
    type: string;
    detail: string;
    ip?: string;
    device?: string;
  }) {
    try {
      await prisma.activityLog.create({
        data: params
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getRecent() {
    return await prisma.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
  }
}
