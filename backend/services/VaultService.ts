import { prisma } from "../config/db";

export class VaultService {
  static async getVaults(userId: string) {
    return await prisma.vault.findMany({
      where: { userId }
    });
  }

  static async createVault(userId: string, data: { name: string, targetAmount?: number, category: string, lockUntil?: string, interestRate?: number }) {
    return await prisma.vault.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount ? BigInt(Math.round(data.targetAmount * 100)) : null,
        category: data.category,
        lockUntil: data.lockUntil ? new Date(data.lockUntil) : null,
        interestRate: data.interestRate || 8.5,
        balance: 0n
      }
    });
  }

  static async fundVault(userId: string, vaultId: string, amount: number) {
    const amountKobo = BigInt(Math.round(amount * 100));

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { accounts: true } });
      const account = user?.accounts[0];
      if (!account || account.balance < amountKobo) throw new Error("Insufficient balance");

      const updatedVault = await tx.vault.update({
        where: { id: vaultId, userId },
        data: { balance: { increment: amountKobo } }
      });

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: amountKobo } }
      });

      await tx.transaction.create({
        data: {
          amount: amountKobo,
          type: 'TRANSFER',
          status: 'SUCCESS',
          reference: `VLT-FND-${Date.now()}`,
          description: `Funding Vault: ${updatedVault.name}`,
          senderAccountId: account.id,
          processedAt: new Date()
        }
      });

      return { updatedVault, updatedAccount };
    });
  }

  static async withdrawFromVault(userId: string, vaultId: string, amount: number) {
    const amountKobo = BigInt(Math.round(amount * 100));

    return await prisma.$transaction(async (tx) => {
      const vault = await tx.vault.findUnique({ where: { id: vaultId, userId } });
      if (!vault || vault.balance < amountKobo) throw new Error("Insufficient vault balance");

      if (vault.lockUntil && vault.lockUntil > new Date()) {
        throw new Error(`Vault is locked until ${vault.lockUntil.toLocaleDateString()}`);
      }

      const user = await tx.user.findUnique({ where: { id: userId }, include: { accounts: true } });
      const account = user?.accounts[0];
      if (!account) throw new Error("Destination account not found");

      const updatedVault = await tx.vault.update({
        where: { id: vaultId },
        data: { balance: { decrement: amountKobo } }
      });

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: amountKobo } }
      });

      await tx.transaction.create({
        data: {
          amount: amountKobo,
          type: 'TRANSFER',
          status: 'SUCCESS',
          reference: `VLT-WDR-${Date.now()}`,
          description: `Withdrawal from Vault: ${vault.name}`,
          receiverAccountId: account.id,
          processedAt: new Date()
        }
      });

      return { updatedVault, updatedAccount };
    });
  }

  /**
   * Daily interest calculation (runs via cron)
   * Daily rate = (Annual Rate / 365)
   */
  static async applyDailyInterest() {
    const vaults = await prisma.vault.findMany({
      where: { balance: { gt: 0n } }
    });

    console.log(`[Vault] Processing interest for ${vaults.length} vaults...`);

    for (const vault of vaults) {
      const annualRate = vault.interestRate || 8.5;
      const dailyRate = annualRate / 100 / 365;
      const interest = BigInt(Math.round(Number(vault.balance) * dailyRate));

      if (interest > 0n) {
        await prisma.$transaction([
          prisma.vault.update({
            where: { id: vault.id },
            data: { balance: { increment: interest } }
          }),
          prisma.ledger.create({
            data: {
              accountId: vault.userId, // Using userId as a proxy if we don't have a specific account
              amount: interest,
              balance: vault.balance + interest,
              reason: `Daily Interest Credit (${annualRate}%)`
            }
          })
        ]);
      }
    }
  }
}
