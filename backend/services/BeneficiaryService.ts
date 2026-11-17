import { prisma } from "../config/db";

export class BeneficiaryService {
  static async getBeneficiaries(userId: string) {
    return await prisma.beneficiary.findMany({
      where: { userId }
    });
  }

  static async addBeneficiary(userId: string, data: { name: string, accountNumber: string, bankName: string, bankCode: string }) {
    return await prisma.beneficiary.create({
      data: {
        userId,
        name: data.name,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        bankCode: data.bankCode
      }
    });
  }

  static async deleteBeneficiary(userId: string, id: string) {
    return await prisma.beneficiary.delete({
      where: { id, userId }
    });
  }
}
