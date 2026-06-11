import { prisma } from '../config/db';
import { PaymentGatewayService } from './PaymentGatewayService';
import { NotificationService } from './NotificationService';

export class AuthService {
  static async syncUser(firebaseUser: { uid: string; email?: string; name?: string; phoneNumber?: string }) {
    const { uid, email, name, phoneNumber } = firebaseUser;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if user exists
      let user = await tx.user.findUnique({
        where: { firebaseId: uid }
      });

      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        // 2. Create User
        user = await tx.user.create({
          data: {
            firebaseId: uid,
            email: email || '',
            name: name || 'Viva User',
            phoneNumber: phoneNumber || null,
            role: 'USER',
            tier: 1,
            isVerified: false,
          }
        });

        // 3. Provision Real Virtual Account via Paystack
        const vAccount = await PaymentGatewayService.createVirtualAccount({
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber || undefined
        });

        const accountNumber = vAccount?.accountNumber || "81" + Math.floor(10000000 + Math.random() * 90000000).toString();
        const bankName = vAccount?.bankName || "VIVA BANK";

        await (tx.account as any).create({
          data: {
            userId: user.id,
            accountNumber,
            balance: 0n,
            currency: 'NGN',
            status: 'ACTIVE',
            metadata: { provider_bank: bankName }
          }
        });
      }

      return { user, isNewUser };
    });

    if (result.isNewUser && result.user.email) {
      // Send Welcome Email outside transaction
      NotificationService.sendWelcomeEmail(result.user.email, result.user.name).catch(err => console.error("Welcome email failed:", err));
    }

    return result.user;
  }
}
