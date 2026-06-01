import express from "express";
import "dotenv/config";
import path from "path";
import { createServer as createHttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import { NotificationService } from "./backend/services/NotificationService";
import { SecurityService } from "./backend/services/SecurityService";
import { TransferService } from "./backend/services/TransferService";
import { rateLimiter } from "./backend/middleware/RateLimiter";
import { PersonalFinanceService } from "./backend/services/PersonalFinanceService";
import { AIService } from "./backend/services/AIService";
import { RewardService } from "./backend/services/RewardService";
import { SocketService } from "./backend/services/SocketService";
import { prisma } from "./backend/config/db";
import { PaymentGatewayService } from "./backend/services/PaymentGatewayService";
import crypto from 'crypto';
import { AccountService } from "./backend/services/AccountService";
import { CardService } from "./backend/services/CardService";
import { VaultService } from "./backend/services/VaultService";
import { InvoiceService } from "./backend/services/InvoiceService";
import { StaffService } from "./backend/services/StaffService";
import { PaymentLinkService } from "./backend/services/PaymentLinkService";
import { KYCService } from "./backend/services/KYCService";
import { ApprovalService } from "./backend/services/ApprovalService";
import { BillService } from "./backend/services/BillService";
import { RechargeService } from "./backend/services/RechargeService";
import { BeneficiaryService } from "./backend/services/BeneficiaryService";
import { ScheduledPaymentService } from "./backend/services/ScheduledPaymentService";
import { FinanceService } from "./backend/services/FinanceService";
import { UserService } from "./backend/services/UserService";
import { USSDService } from "./backend/services/USSDService";
import { AdminService } from "./backend/services/AdminService";
import { authenticate, AuthenticatedRequest } from "./backend/middleware/AuthMiddleware";
import { AuthService } from "./backend/services/AuthService";
import { ActivityService } from "./backend/services/ActivityService";
import { requireAdmin } from "./backend/middleware/AuthMiddleware";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Professional Architecture Imports
import { initMonitoring } from "./backend/monitoring/Sentry";
import { queueTransaction } from "./backend/queues/TransferQueue";
import "./backend/workers/TransferWorker";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'vivabanking',
    });
  } catch (err) {
    console.warn("Firebase Admin initialization failed. Push notifications will be disabled.");
  }
}

async function startServer() {
  // Initialize Professional Monitoring (Sentry)
  initMonitoring();

  // Schedule Vault Interest (Daily at midnight - Simulated with setInterval)
  // In production, use BullMQ repeatable jobs or node-cron
  setInterval(() => {
    console.log("[Scheduler] Running daily vault interest application...");
    VaultService.applyDailyInterest().catch(err => console.error("Interest calculation failed:", err));
  }, 24 * 60 * 60 * 1000);

  const app = express();
  const httpServer = createHttpServer(app);
  const io = SocketService.init(httpServer);
  const PORT = 3000;

  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Security Headers for Banking Compliance
  app.use((req, res, next) => {
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    res.header("X-XSS-Protection", "1; mode=block");
    res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });

  // CORS Configuration for Mobile APK
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(rateLimiter);

  // Health check
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Paystack Webhook (No Auth - uses signature)
  app.post("/api/webhooks/paystack", async (req: any, res) => {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock').update(req.rawBody).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { amount, reference, customer, metadata } = event.data;
      try {
        await AccountService.creditAccount({
          email: customer.email,
          amount: amount / 100, // Paystack sends in Kobo
          reference,
          description: `Paystack Deposit: ${reference}`,
          type: 'DEPOSIT'
        } as any);
        console.log(`[Webhook] Deposit successful for ${customer.email}: ${amount}`);
      } catch (err) {
        console.error('[Webhook] Error processing deposit:', err);
      }
    }
    res.sendStatus(200);
  });

  // --- AUTH & PROFILE ---

  app.get("/api/user", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await UserService.getProfile(req.user?.dbId!);
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/sync", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await AuthService.syncUser({
        uid: req.user?.uid!,
        email: req.user?.email,
        name: req.body.name,
        phoneNumber: req.body.phoneNumber
      });

      await ActivityService.log({
        userId: user.id,
        type: 'REGISTRATION',
        detail: `Account synced: ${user.email}`,
        ip: req.ip
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Sync failed" });
    }
  });

  app.get("/api/admin/stats", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await AdminService.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await AdminService.getUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/promote/:userId", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await AdminService.promoteUser(req.params.userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to promote user" });
    }
  });

  app.post("/api/admin/user/:userId/risk", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await AdminService.updateRiskLevel(req.params.userId, req.body.riskLevel);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update risk level" });
    }
  });

  app.post("/api/user/set-pin", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await UserService.setTransactionPin(req.user?.dbId!, req.body.pin);
      res.json({ success: true, message: "Transaction PIN set successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to set PIN" });
    }
  });

  app.post("/api/user/fcm-token", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await UserService.updateFcmToken(req.user?.dbId!, req.body.token);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update token" });
    }
  });

  app.get("/api/approvals/pending", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const pending = await ApprovalService.getPendingApprovals(req.user?.dbId!);
      res.json(pending.map(tx => ({ ...tx, amount: Number(tx.amount) / 100 })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.get("/api/payment-links", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const links = await PaymentLinkService.getLinks(req.user?.dbId!);
      res.json(links.map(l => ({
        ...l,
        amount: l.amount ? Number(l.amount) / 100 : null,
        totalReceived: Number(l.totalReceived) / 100
      })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  app.post("/api/payment-links", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const link = await PaymentLinkService.createLink(req.user?.dbId!, req.body);
      res.json(link);
    } catch (err) {
      res.status(500).json({ error: "Failed to create link" });
    }
  });

  app.post("/api/transfer/bulk", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await TransferService.initiateBulkTransfer(req.user?.dbId!, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Bulk transfer failed" });
    }
  });

  app.post("/api/approvals/approve", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await ApprovalService.approveTransaction(req.user?.dbId!, req.body.transactionId, req.body.pin);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || "Approval failed" });
    }
  });

  app.post("/api/approvals/decline", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await ApprovalService.declineTransaction(req.user?.dbId!, req.body.transactionId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(403).json({ error: err.message || "Decline failed" });
    }
  });

  app.get("/api/banks/resolve", authenticate, async (req, res) => {
    const { accountNumber, bankCode } = req.query;
    try {
      const result = await PaymentGatewayService.resolveAccount(accountNumber as string, bankCode as string);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/transfer", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await TransferService.initiateTransfer(req.user?.dbId!, req.body);

      await ActivityService.log({
        userId: req.user?.dbId!,
        type: 'TRANSFER_INITIATED',
        detail: `Transferred ${req.body.amount} to ${req.body.receiver}`,
        ip: req.ip
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Transfer failed" });
    }
  });

  app.post("/api/withdraw", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await FinanceService.withdraw(req.user?.dbId!, req.body);
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message || "Withdrawal failed" }); }
  });

  app.post("/api/kyc/verify", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await KYCService.verifyIdentity(req.user?.dbId!, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Verification failed" });
    }
  });

  app.post("/api/user/verify-pin", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const isValid = await UserService.verifyTransactionPin(req.user?.dbId!, req.body.pin);
      res.json({ success: isValid });
    } catch (err) {
      res.status(500).json({ error: "Error" });
    }
  });

  app.get("/api/payments/scheduled", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const payments = await ScheduledPaymentService.getScheduled(req.user?.dbId!);
      res.json(payments.map(p => ({ ...p, amount: Number(p.amount) / 100 })));
    } catch (err) {
      res.status(500).json({ error: "Error" });
    }
  });

  app.get("/api/vaults", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const vaults = await VaultService.getVaults(req.user?.dbId!);
      res.json(vaults.map(v => ({ ...v, balance: Number(v.balance) / 100 })));
    } catch (err) {
      res.status(500).json({ error: "Error" });
    }
  });

  app.get("/api/accounts", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const accounts = await AccountService.getAccounts(req.user?.dbId!);
      res.json(accounts.map(acc => ({ ...acc, balance: Number(acc.balance) / 100 })));
    } catch (err) {
      res.status(500).json({ error: "Error" });
    }
  });

  app.post("/api/accounts/create", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const account = await AccountService.createAccount(req.user?.dbId!, req.body.currency);
      res.json(account);
    } catch (err) {
      res.status(500).json({ error: "Error" });
    }
  });

  app.get("/api/finance/ai-insights", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const insights = await AIService.getInsights(req.user?.dbId!);
      res.json(insights);
    } catch (err) {
      res.status(500).json({ error: "Error" });
    }
  });

  app.post("/api/referral/apply", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await FinanceService.applyReferral(req.user?.dbId!, req.body.code);
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  app.post("/api/ussd/process", async (req, res) => {
    const { phoneNumber, text } = req.body;
    const response = await USSDService.processRequest(phoneNumber, text);
    res.send(response);
  });

  app.get("/api/rewards/balance", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const balance = await RewardService.getRewardBalance(req.user?.dbId!);
      res.json({ balance: Number(balance) / 100 });
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.get("/api/invoices", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const invoices = await InvoiceService.getInvoices(req.user?.dbId!);
      res.json(invoices.map(i => ({ ...i, amount: Number(i.amount) / 100 })));
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/invoices", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const invoice = await InvoiceService.createInvoice(req.user?.dbId!, req.body);
      res.json(invoice);
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.get("/api/staff", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const staff = await StaffService.getStaff(req.user?.dbId!);
      res.json(staff);
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/staff", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const staff = await StaffService.addStaff(req.user?.dbId!, req.body);
      res.json(staff);
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/vaults", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const vault = await VaultService.createVault(req.user?.dbId!, req.body);
      res.json(vault);
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/vaults/:id/fund", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await VaultService.fundVault(req.user?.dbId!, req.params.id, req.body.amount);
      res.json({ success: true, ...result });
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  app.post("/api/vaults/:id/withdraw", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await VaultService.withdrawFromVault(req.user?.dbId!, req.params.id, req.body.amount);
      res.json({ success: true, ...result });
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  app.delete("/api/payments/scheduled/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await ScheduledPaymentService.delete(req.user?.dbId!, req.params.id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/beneficiaries", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const beneficiary = await BeneficiaryService.addBeneficiary(req.user?.dbId!, req.body);
      res.json(beneficiary);
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.delete("/api/beneficiaries/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await BeneficiaryService.deleteBeneficiary(req.user?.dbId!, req.params.id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.get("/api/cards", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const cards = await CardService.getCards(req.user?.dbId!);
      res.json(cards.map(card => ({ ...card, status: card.status.toLowerCase() })));
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.get("/api/cards/:id/details", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const details = await CardService.getCardDetails(req.params.id);
      if (!details) return res.status(404).json({ error: "Error" });
      res.json(details);
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/cards/create", authenticate, async (req: AuthenticatedRequest, res) => {
    const { type, color } = req.body;
    try {
      const card = await CardService.createCard(req.user?.dbId!, type, color);
      res.json({ success: true, card });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Error" });
    }
  });

  app.post("/api/cards/:id/status", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const card = await CardService.updateCardStatus(req.params.id, req.body.status);
      res.json({ success: true, status: card.status.toLowerCase() });
    } catch (err) { res.status(500).json({ error: "Error" }); }
  });

  app.post("/api/bills/pay", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await BillService.payBill(req.user?.dbId!, req.body);
      res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  app.post("/api/recharge", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      await RechargeService.recharge(req.user?.dbId!, req.body);
      res.json({ success: true });
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  app.post("/api/invest/create", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await FinanceService.invest(req.user?.dbId!, req.body);
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  app.post("/api/scan/pay", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await FinanceService.scanPay(req.user?.dbId!, req.body);
      res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message || "Error" }); }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  httpServer.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}
startServer();
