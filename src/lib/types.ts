export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
  tier: number;
  isVerified: boolean;
  transactionPin?: boolean;
  accountNumber?: string;
  balance: number;
  providerBank?: string;
  is2FAEnabled: boolean;
  isBiometricEnabled: boolean;
  referralCode?: string;
  rewardBalance?: number;
  bvn?: string;
  nin?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  sender: string;
  receiver: string;
  date: string;
  status: string;
  category?: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
}
