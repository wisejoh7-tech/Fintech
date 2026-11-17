import { prisma } from "../config/db";
import { PaymentGatewayService } from "./PaymentGatewayService";
import { SecurityService } from "./SecurityService";

export class KYCService {
  static async verifyIdentity(userId: string, data: { type: 'bvn' | 'nin', value: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // 1. Verify via Payment Gateway (Paystack/VerifyMe)
    const kycResult = await PaymentGatewayService.verifyIdentity({
      type: data.type,
      value: data.value,
      name: user.name
    });

    if (kycResult.status) {
      // 2. Update user status and encrypt sensitive info
      return await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          tier: user.tier < 2 ? 2 : user.tier,
          [data.type]: SecurityService.encrypt(data.value)
        }
      });
    }

    throw new Error("Identity verification failed with provider");
  }

  static async submitBusinessDocs(userId: string, data: { utilityBill: string, businessCert: string }) {
    return await (prisma.user as any).update({
      where: { id: userId },
      data: {
        tier: 3, // Upgrade to Corporate Tier
        metadata: {
          kyc_docs: {
            utilityBill: data.utilityBill,
            businessCert: data.businessCert,
            submittedAt: new Date()
          }
        }
      }
    });
  }
}
