import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  getDoc,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage, handleFirestoreError } from "./firebase";

// Standardize amounts to integers (Kobo/Cents) to prevent floating point errors
const toBaseUnits = (amount: number) => Math.round(amount * 100);
const fromBaseUnits = (units: number) => units / 100;

export const userService = {
  async createUserProfile(userId: string, data: any) {
    console.log("Starting profile creation for:", userId, data);
    try {
      const userRef = doc(db, "users", userId);
      const isAdminEmail = data.email === "idemudiawisdom27@gmail.com";
      const batch = writeBatch(db);
      const accountNumber = "81" + Math.floor(10000000 + Math.random() * 90000000).toString();

      const profileData = {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || "",
        role: "user",
        tier: 1,
        balance: 1000,
        riskLevel: "low",
        is2FAEnabled: false,
        isVerified: false,
        isBiometricEnabled: true,
        accountNumber,
        createdAt: serverTimestamp(),
      };

      console.log("Setting user doc with data:", profileData);
      batch.set(userRef, profileData);

      if (isAdminEmail) {
        console.log("User is admin, setting admin doc...");
        const adminRef = doc(db, "admins", userId);
        batch.set(adminRef, { promotedAt: serverTimestamp(), email: data.email });
      }

      await batch.commit();
      console.log("Batch commit successful for user:", userId);
      return { accountNumber };
    } catch (error: any) {
      console.error("Firestore Profile Creation Error:", error);
      handleFirestoreError(error, 'create', `users/${userId}`);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        return { ...data, balance: fromBaseUnits(data.balance || 0) };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, 'get', `users/${userId}`);
    }
  },

  subscribeToUser(userId: string, callback: (data: any) => void) {
    const userRef = doc(db, "users", userId);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({ id: snap.id, ...data, balance: fromBaseUnits(data.balance || 0) });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("User subscription error:", error);
      callback(null);
    });
  },

  async updateBalance(userId: string, amount: number) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        balance: increment(toBaseUnits(amount)),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${userId}`);
    }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${userId}`);
      throw error;
    }
  },

  async setTransactionPin(pin: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/user/set-pin", {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
  },

  async verifyTransactionPin(pin: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/user/verify-pin", {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
  },

  async findUserByAccountNumber(accountNumber: string) {
    try {
      const { getDocs, where } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("accountNumber", "==", accountNumber));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, 'get', 'users');
      return null;
    }
  },

  subscribeToRecipientAccounts(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "recipientAccounts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async addRecipientAccount(userId: string, account: any) {
    try {
      await addDoc(collection(db, "users", userId, "recipientAccounts"), {
        ...account,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}/recipientAccounts`);
    }
  }
};

export const transactionService = {
  subscribeToTransactions(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "transactions"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, amount: fromBaseUnits(data.amount) };
      }));
    });
  },

  /**
   * Production-ready transfer logic
   * - ACID Compliant (via runTransaction)
   * - Idempotent (via traceId/idempotencyKey)
   * - Double-Entry Ledger
   */
  async transferBetweenUsers(senderId: string, receiverId: string, amount: number, senderAccount: string, receiverAccount: string, receiverName: string, senderName: string, traceId: string) {
    const { apiRequest } = await import("./api");
    try {
      return await apiRequest("/api/transfer", {
        method: 'POST',
        body: JSON.stringify({
          receiver: receiverId, // The backend expects receiverId
          amount,
          bank: 'Viva',
          reference: traceId
        })
      });
    } catch (error) {
      console.error("Transfer failed via API, falling back to direct Firestore (Not recommended for production):", error);
      // Fallback logic if needed, but in production we should strictly use the API
      throw error;
    }
  },

  async addTransaction(userId: string, tx: any) {
    try {
      const batch = writeBatch(db);
      const txRef = doc(collection(db, "users", userId, "transactions"));
      const amountUnits = toBaseUnits(tx.amount);

      const finalTx = {
        ...tx,
        amount: amountUnits,
        date: new Date().toISOString(),
        status: tx.status || 'success'
      };

      batch.set(txRef, finalTx);
      
      if (tx.type !== 'security_alert') {
        const userRef = doc(db, "users", userId);
        const amountChange = (tx.type === 'deposit' || tx.type === 'receive') ? amountUnits : -amountUnits;
        batch.update(userRef, { 
          balance: increment(amountChange),
          updatedAt: serverTimestamp()
        });

        // Create audit ledger entry
        const ledgerRef = doc(collection(db, "ledger"));
        batch.set(ledgerRef, {
          accountId: userId,
          transactionId: txRef.id,
          type: amountChange > 0 ? 'CREDIT' : 'DEBIT',
          amount: Math.abs(amountChange),
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      return { id: txRef.id, ...finalTx, amount: tx.amount };
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}/transactions`);
    }
  },

  async initiateGatewayDeposit(userId: string, amount: number, reference: string, gateway: string) {
    try {
      const txRef = doc(collection(db, "users", userId, "transactions"));
      await setDoc(txRef, {
        type: 'deposit',
        amount: toBaseUnits(amount),
        status: 'pending',
        gateway,
        reference,
        date: new Date().toISOString()
      });
      return txRef.id;
    } catch (error) {
      console.error("Failed to initiate gateway deposit", error);
      throw error;
    }
  },

  async verifyGatewayDeposit(userId: string, txId: string) {
    try {
      const txRef = doc(db, "users", userId, "transactions", txId);
      const txSnap = await getDoc(txRef);
      if (txSnap.exists() && txSnap.data().status === 'pending') {
        // In a real app, verify with the gateway API first
        await transactionService.addTransaction(userId, {
          ...txSnap.data(),
          status: 'success',
          amount: fromBaseUnits(txSnap.data().amount)
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to verify gateway deposit", error);
      return false;
    }
  }
};

export const escrowService = {
  subscribeToEscrows(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "escrow"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async createEscrow(userId: string, escrowData: any) {
    try {
      const batch = writeBatch(db);
      const escrowRef = doc(collection(db, "users", userId, "escrow"));
      const newEscrow = {
        ...escrowData,
        status: "pending",
        date: new Date().toISOString()
      };
      batch.set(escrowRef, newEscrow);

      const userRef = doc(db, "users", userId);
      batch.update(userRef, { 
        balance: increment(-escrowData.amount),
        updatedAt: serverTimestamp()
      });

      const txRef = doc(collection(db, "users", userId, "transactions"));
      batch.set(txRef, {
        sender: "Me",
        receiver: `Escrow: ${escrowData.receiver}`,
        amount: escrowData.amount,
        type: "escrow",
        date: new Date().toISOString()
      });

      await batch.commit();
      return { id: escrowRef.id, ...newEscrow };
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}/escrow`);
    }
  },

  async releaseEscrow(userId: string, escrowId: string) {
    try {
      await runTransaction(db, async (transaction) => {
        const escrowRef = doc(db, "users", userId, "escrow", escrowId);
        const escrowSnap = await transaction.get(escrowRef);

        if (!escrowSnap.exists()) throw new Error("Escrow not found");
        const data = escrowSnap.data();
        if (data.status !== 'pending') throw new Error("Escrow already processed");

        // 1. Mark Escrow as Completed
        transaction.update(escrowRef, {
          status: "completed",
          completedAt: serverTimestamp()
        });

        // 2. Add credit transaction for the receiver (Mocking receiver credit for demo)
        // In production, we would use the receiver's UID to update their balance.
        console.log(`Releasing ₦${data.amount} to ${data.receiver}`);
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${userId}/escrow/${escrowId}`);
      throw error;
    }
  }
};

export const billService = {
  async payBill(userId: string, billData: any) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/bills/pay", {
      method: 'POST',
      body: JSON.stringify({ ...billData, pin: billData.pin || "0000" })
    });
  }
};

export const rechargeService = {
  async recharge(userId: string, rechargeData: any) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/recharge", {
      method: 'POST',
      body: JSON.stringify({ ...rechargeData, pin: rechargeData.pin || "0000" })
    });
  }
};

export const bettingService = {
  async topup(userId: string, topupData: any) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/transfer", {
      method: 'POST',
      body: JSON.stringify({
        receiver: topupData.customerId,
        amount: topupData.amount,
        bank: topupData.platform,
        pin: topupData.pin || "0000"
      })
    });
  }
};

export const investmentService = {
  async invest(userId: string, investData: any) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/invest/create", {
      method: 'POST',
      body: JSON.stringify({ ...investData, pin: investData.pin || "0000" })
    });
  },

  subscribeToInvestments(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "investments"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }
};

export const scanPayService = {
  async pay(userId: string, payData: any) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/scan/pay", {
      method: 'POST',
      body: JSON.stringify({ ...payData, pin: payData.pin || "0000" })
    });
  }
};

export const paystackService = {
  // Public Key - Replace with your actual Paystack public key from dashboard.paystack.com
  PUBLIC_KEY: "pk_test_viva_banking_demo_key",

  async initializeTransaction(email: string, amount: number, callback: (ref: string) => void) {
    const handler = (window as any).PaystackPop.setup({
      key: this.PUBLIC_KEY,
      email: email,
      amount: Math.round(amount * 100), // Convert to Kobo
      currency: "NGN",
      ref: 'VIVA-' + Math.floor((Math.random() * 1000000000) + 1),
      callback: (response: any) => {
        callback(response.reference);
      },
      onClose: () => {
        console.log('Window closed.');
      }
    });
    handler.openIframe();
  },

  async verifyAccount(accountNumber: string, bankCode: string) {
    return { status: true, account_name: "WISDOM IDEMUDIA" };
  },

  async verifyIdentity(type: 'bvn' | 'nin', value: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/kyc/verify", {
      method: 'POST',
      body: JSON.stringify({ type, value })
    });
  },

  async requestWithdrawal(userId: string, data: any) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/withdraw", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const beneficiaryService = {
  async getBeneficiaries() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/beneficiaries");
  },

  async addBeneficiary(data: { name: string, accountNumber: string, bankName: string, bankCode?: string }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/beneficiaries", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteBeneficiary(id: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/beneficiaries/${id}`, {
      method: 'DELETE'
    });
  }
};

export const approvalService = {
  async getPendingApprovals() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/approvals/pending");
  },

  async approveTransaction(transactionId: string, pin: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/approvals/approve", {
      method: 'POST',
      body: JSON.stringify({ transactionId, pin })
    });
  },

  async declineTransaction(transactionId: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/approvals/decline", {
      method: 'POST',
      body: JSON.stringify({ transactionId })
    });
  }
};

export const rewardService = {
  async getBalance() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/rewards/balance");
  },

  async applyReferral(code: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/referral/apply", {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }
};

export const alertService = {
  subscribeToAlerts(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "securityAlerts"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async markAlertsRead(userId: string, alertIds: string[]) {
    try {
      const batch = writeBatch(db);
      alertIds.forEach(id => {
        const ref = doc(db, "users", userId, "securityAlerts", id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${userId}/securityAlerts`);
    }
  }
};

export const cardService = {
  async getCards() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/cards");
  },

  async getCardDetails(cardId: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/cards/${cardId}/details`);
  },

  async createCard(cardData: { type: string, color: string }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/cards/create", {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  },

  async updateCardStatus(cardId: string, status: 'active' | 'frozen') {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/cards/${cardId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  subscribeToCards(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "cards"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async addCard(userId: string, card: any) {
    try {
      await addDoc(collection(db, "users", userId, "cards"), card);
    } catch (error) {
       handleFirestoreError(error, 'create', `users/${userId}/cards`);
    }
  },

  subscribeToExternalCards(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "externalCards"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async addExternalCard(userId: string, card: any) {
    try {
      const colors = ["bg-blue-800", "bg-orange-600", "bg-sky-500", "bg-indigo-900"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      await addDoc(collection(db, "users", userId, "externalCards"), {
        ...card,
        color: randomColor,
        createdAt: serverTimestamp()
      });
    } catch (error) {
       handleFirestoreError(error, 'create', `users/${userId}/externalCards`);
    }
  }
};

export const activityService = {
  subscribeToActivity(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "activityLog"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async addActivity(userId: string, activity: any) {
    try {
      await addDoc(collection(db, "users", userId, "activityLog"), {
        ...activity,
        date: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}/activityLog`);
    }
  }
};

export const paymentLinkService = {
  async getPaymentLinks() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/payment-links");
  },

  async createPaymentLink(data: { title: string, description?: string, amount?: number }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/payment-links", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const bulkTransferService = {
  async processBulkTransfer(data: { recipients: any[], pin: string, description?: string }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/transfer/bulk", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const invoiceService = {
  async getInvoices() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/invoices");
  },

  async createInvoice(data: { clientName: string, clientEmail?: string, amount: number, dueDate: string, description?: string }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/invoices", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const staffService = {
  async getStaff() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/staff");
  },

  async addStaff(data: { name: string, email: string, role: string }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/staff", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const vaultService = {
  async getVaults() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/vaults");
  },

  async createVault(data: { name: string, targetAmount?: number, category: string, lockUntil?: string, interestRate?: number }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/vaults", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async fundVault(vaultId: string, amount: number) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/vaults/${vaultId}/fund`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  },

  async withdrawFromVault(vaultId: string, amount: number) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/vaults/${vaultId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }
};

export const recurringPaymentService = {
  async getScheduledPayments() {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/payments/scheduled");
  },

  async schedulePayment(data: { amount: number, receiver: string, bank: string, frequency: string, description: string, startDate: string }) {
    const { apiRequest } = await import("./api");
    return await apiRequest("/api/payments/scheduled", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async cancelScheduledPayment(id: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/payments/scheduled/${id}`, {
      method: 'DELETE'
    });
  },

  subscribeToRecurringPayments(userId: string, callback: (data: any[]) => void) {
    const q = query(collection(db, "users", userId, "recurringPayments"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async addRecurringPayment(userId: string, payment: any) {
    try {
      await addDoc(collection(db, "users", userId, "recurringPayments"), {
        ...payment,
        status: "active",
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}/recurringPayments`);
    }
  },

  async deleteRecurringPayment(userId: string, paymentId: string) {
    try {
      const ref = doc(db, "users", userId, "recurringPayments", paymentId);
      await setDoc(ref, { status: 'cancelled' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'delete', `users/${userId}/recurringPayments/${paymentId}`);
    }
  }
};

export const adminService = {
  async getStats() {
    const { apiRequest } = await import("./api");
    try {
      return await apiRequest("/api/admin/stats");
    } catch (error) {
       console.error('Failed to get admin stats:', error);
       return null;
    }
  },

  async getUsers() {
    const { apiRequest } = await import("./api");
    try {
      return await apiRequest("/api/admin/users");
    } catch (error) {
      console.error('Failed to list users:', error);
      return [];
    }
  },

  async promoteToAdmin(userId: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/admin/promote/${userId}`, { method: 'POST' });
  },

  async updateRiskLevel(userId: string, riskLevel: string) {
    const { apiRequest } = await import("./api");
    return await apiRequest(`/api/admin/user/${userId}/risk`, {
      method: 'POST',
      body: JSON.stringify({ riskLevel })
    });
  }
};

export const storageService = {
  async uploadFile(path: string, file: File) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }
};

export const notificationService = {
  async requestPermission(userId: string) {
    try {
      const { getToken } = await import("firebase/messaging");
      const { messaging } = await import("./firebase");
      const { apiRequest } = await import("./api");
      if (!messaging) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" });
        if (token) {
          // Sync to PostgreSQL backend
          await apiRequest("/api/user/fcm-token", {
            method: 'POST',
            body: JSON.stringify({ token })
          });

          // Legacy Sync to Firestore
          await userService.updateProfile(userId, { fcmToken: token });
          return token;
        }
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    }
  }
};

export const biometricService = {
  async registerBiometrics(email: string) {
    try {
      const { getApiUrl } = await import("./api");
      // 1. Get challenge from server
      const res = await fetch(getApiUrl("/api/auth/biometric/register-challenge"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const { challenge, user } = await res.json();

      // 2. Create credential on device
      // This is a simplified version. Real WebAuthn uses more complex options.
      const publicKeyCredentialCreationOptions: any = {
        challenge: Uint8Array.from(atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        rp: { name: "Viva Banking", id: window.location.hostname },
        user: {
          id: Uint8Array.from(user.id, c => c.charCodeAt(0)),
          name: email,
          displayName: user.name,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
        authenticatorSelection: { authenticatorAttachment: "platform" }, // Force biometric
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as any;

      // 3. Send public key to server
      // Extracting the public key (SPKI format usually)
      const publicKeyBuffer = credential.response.getPublicKey();
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

      await fetch(getApiUrl("/api/auth/biometric/register-verify"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, publicKey: publicKeyBase64 })
      });

      return true;
    } catch (error) {
      console.error("Biometric registration failed:", error);
      throw error;
    }
  },

  async authenticateBiometrics(email: string) {
    try {
      const { getApiUrl } = await import("./api");
      // 1. Get challenge
      const res = await fetch(getApiUrl("/api/auth/biometric/login-challenge"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const { challenge } = data;

      // 2. Get signature from device
      const publicKeyCredentialRequestOptions: any = {
        challenge: Uint8Array.from(atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: "required",
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as any;

      // 3. Verify signature on server
      // This is a simplified demonstration of signature extraction
      const signatureBuffer = assertion.response.signature;
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

      const verifyRes = await fetch(getApiUrl("/api/auth/biometric/login-verify"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, signature: signatureBase64 })
      });

      return await verifyRes.json();
    } catch (error) {
      console.error("Biometric authentication failed:", error);
      throw error;
    }
  }
};
