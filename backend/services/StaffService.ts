import { prisma } from "../config/db";

export class StaffService {
  static async getStaff(companyId: string) {
    return await prisma.staffAccount.findMany({
      where: { companyId }
    });
  }

  static async addStaff(companyId: string, data: { name: string, email: string, role: string }) {
    return await prisma.staffAccount.create({
      data: {
        companyId,
        name: data.name,
        email: data.email,
        role: data.role as any
      }
    });
  }
}
