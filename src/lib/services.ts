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
  writeBatch
} from "firebase/firestore";
import { db, auth, handleFirestoreError } from "./firebase";

export const userService = {
  async createUserProfile(userId: string, data: any) {
    try {
      const userRef = doc(db, "users", userId);
      const isAdminEmail = data.email === "idemudiawisdom27@gmail.com";
      const batch = writeBatch(db);
      
      batch.set(userRef, {
        ...data,
        role: isAdminEmail ? "admin" : "user",
        tier: 1,
        balance: 1000,
        riskLevel: "low",
        is2FAEnabled: false,
        isVerified: false,
        isBiometricEnabled: true,
        accountNumber: "81" + Math.floor(10000000 + Math.random() * 90000000).toString(),
        createdAt: serverTimestamp(),
      });

      if (isAdminEmail) {
        const adminRef = doc(db, "admins", userId);
        batch.set(adminRef, { promotedAt: serverTimestamp() });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}`);
    }
  },

  async getUser(userId: string) {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      handleFirestoreError(error, 'get', `users/${userId}`);
    }
  },

  subscribeToUser(userId: string, callback: (data: any) => void) {
    const userRef = doc(db, "users", userId);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
  },

  async updateBalance(userId: string, amount: number) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        balance: increment(amount),
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
    }
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
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  async addTransaction(userId: string, tx: any) {
    try {
      const batch = writeBatch(db);
      const txRef = doc(collection(db, "users", userId, "transactions"));
      const finalTx = { ...tx, date: new Date().toISOString() };
      batch.set(txRef, finalTx);
      
      if (tx.type !== 'security_alert') {
        const userRef = doc(db, "users", userId);
        const amountChange = (tx.type === 'deposit' || tx.type === 'receive') ? tx.amount : -tx.amount;
        batch.update(userRef, { 
          balance: increment(amountChange),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      return { id: txRef.id, ...finalTx };
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${userId}/transactions`);
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
      const ref = doc(db, "users", userId, "escrow", escrowId);
      await updateDoc(ref, { 
        status: "completed",
        completedAt: serverTimestamp()
      });
      // In a real app, this would trigger a payout to the receiver's account
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${userId}/escrow/${escrowId}`);
    }
  }
};

export const billService = {
  async payBill(userId: string, billData: any) {
    return transactionService.addTransaction(userId, {
      ...billData,
      type: "bill",
      status: "success"
    });
  }
};

export const rechargeService = {
  async recharge(userId: string, rechargeData: any) {
    return transactionService.addTransaction(userId, {
      ...rechargeData,
      type: rechargeData.type === 'airtime' ? "airtime" : "data",
      status: "success"
    });
  }
};

export const bettingService = {
  async topup(userId: string, topupData: any) {
    return transactionService.addTransaction(userId, {
      ...topupData,
      type: "transfer",
      receiver: `Betting: ${topupData.platform}`,
      status: "success"
    });
  }
};

export const investmentService = {
  async invest(userId: string, investData: any) {
    // Basic investment logic: Deduct balance and create a record
    const result = await transactionService.addTransaction(userId, {
      ...investData,
      type: "transfer",
      receiver: `Investment: ${investData.type}`,
      status: "success"
    });

    // We could also record this in an investments collection
    try {
      await addDoc(collection(db, "users", userId, "investments"), {
        ...investData,
        status: "active",
        date: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to record investment details", e);
    }
    
    return result;
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
    // Validate if it's a Viva account or external merchant
    const isVivaMerchant = payData.merchantId.startsWith("VIVA-");
    
    return transactionService.addTransaction(userId, {
      ...payData,
      type: "transfer",
      receiver: isVivaMerchant ? `Merchant: ${payData.merchantId}` : `Scan & Pay: ${payData.merchantId}`,
      status: "success"
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
      const colors = ["bg-blue-800", "bg-orange-600", "bg-emerald-700", "bg-indigo-900"];
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

export const recurringPaymentService = {
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
      await setDoc(ref, { status: 'cancelled' }, { merge: true }); // Prefer soft delete/status update
    } catch (error) {
      handleFirestoreError(error, 'delete', `users/${userId}/recurringPayments/${paymentId}`);
    }
  }
};

export const adminService = {
  async getStats() {
    try {
      const { getDocs, collection } = await import("firebase/firestore");
      const usersSnap = await getDocs(collection(db, "users"));
      
      const stats = {
        totalUsers: usersSnap.size,
        totalTransactions: 1240, 
        totalEscrow: 45,        
        totalVolume: 15420000,   
        recentActivity: [
          { id: "1", type: "System Update", detail: "Risk levels recalculated", date: new Date().toISOString() },
          { id: "2", type: "Security Alert", detail: "Tier 3 verification spike", date: new Date().toISOString() },
          { id: "3", type: "New User", detail: "User registration monitoring active", date: new Date().toISOString() }
        ]
      };
      return stats;
    } catch (error) {
       handleFirestoreError(error, 'get', 'admin/stats');
       return null;
    }
  },

  async getUsers() {
    try {
      const { getDocs, collection, orderBy, query } = await import("firebase/firestore");
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, 'list', 'users');
      return [];
    }
  },

  async promoteToAdmin(userId: string) {
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", userId);
      const adminRef = doc(db, "admins", userId);
      
      batch.update(userRef, { role: 'admin' });
      batch.set(adminRef, { promotedAt: serverTimestamp() });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'update', 'admin/promotion');
    }
  },

  async updateRiskLevel(userId: string, riskLevel: string) {
    return userService.updateProfile(userId, { riskLevel });
  }
};
