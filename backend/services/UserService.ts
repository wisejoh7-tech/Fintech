import { prisma } from "../config/db";
import { SecurityService } from "./SecurityService";

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user) return null;

    const account = user.accounts[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      balance: Number(account?.balance || 0n) / 100,
      accountNumber: account?.accountNumber,
      providerBank: (account?.metadata as any)?.provider_bank || "VIVA BANK",
      tier: user.tier,
      role: user.role,
      isVerified: user.isVerified,
      is2FAEnabled: user.is2FAEnabled,
      isBiometricEnabled: user.isBiometricActive,
      transactionPin: !!user.transactionPin,
      referralCode: user.referralCode,
      rewardBalance: Number(user.rewardBalance) / 100,
      transferLimit: this.getTransferLimit(user)
    };
  }

  static async setTransactionPin(userId: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be 4 digits");

    return await prisma.user.update({
      where: { id: userId },
      data: { transactionPin: SecurityService.hashPassword(pin) }
    });
  }

  static async updateFcmToken(userId: string, token: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token }
    });
  }

  static async verifyTransactionPin(userId: string, pin: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.transactionPin) return false;
    return SecurityService.verifyPassword(pin, user.transactionPin);
  }

  private static getTransferLimit(user: any) {
    if (user.role === 'ADMIN') return 10000000;
    if (user.riskLevel === 'HIGH') return 10000;

    switch (user.tier) {
      case 3: return 10000000;
      case 2: return 1000000;
      case 1:
      default:
        return 100000;
    }
  }
}
