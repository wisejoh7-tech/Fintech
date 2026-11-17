import express from "express";
import userRoutes from "./user";
import webhookRoutes from "./webhook";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/AuthMiddleware";
import { AdminService } from "../services/AdminService";
import { AccountService } from "../services/AccountService";
import { TransferService } from "../services/TransferService";
import { VaultService } from "../services/VaultService";
import { FinanceService } from "../services/FinanceService";
import { AIService } from "../services/AIService";
import { RewardService } from "../services/RewardService";
import { InvoiceService } from "../services/InvoiceService";
import { StaffService } from "../services/StaffService";
import { ScheduledPaymentService } from "../services/ScheduledPaymentService";
import { ApprovalService } from "../services/ApprovalService";
import { PaymentLinkService } from "../services/PaymentLinkService";

const router = express.Router();

// Health Check
router.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Mount Routes
router.use("/user", userRoutes);
router.use("/webhooks", webhookRoutes);

// --- Admin ---
router.get("/admin/stats", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await AdminService.getStats();
    res.json(stats);
  } catch (err) { res.status(500).json({ error: "Failed to fetch admin stats" }); }
});

router.get("/admin/users", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await AdminService.getUsers();
    res.json(users);
  } catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
});

// --- Wallets & Accounts ---
router.get("/accounts", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const accounts = await AccountService.getAccounts(req.user?.dbId!);
    res.json(accounts.map(acc => ({ ...acc, balance: Number(acc.balance) / 100 })));
  } catch (err) { res.status(500).json({ error: "Failed to fetch accounts" }); }
});

router.post("/accounts/create", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const account = await AccountService.createAccount(req.user?.dbId!, req.body.currency);
    res.json(account);
  } catch (err) { res.status(500).json({ error: "Failed to create account" }); }
});

// --- Transfers & Payments ---
router.post("/transfer", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await TransferService.initiateTransfer(req.user?.dbId!, req.body);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post("/transfer/bulk", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await TransferService.initiateBulkTransfer(req.user?.dbId!, req.body);
    res.json(result);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get("/payments/scheduled", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const payments = await ScheduledPaymentService.getScheduled(req.user?.dbId!);
    res.json(payments.map(p => ({ ...p, amount: Number(p.amount) / 100 })));
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

// --- Savings & Vaults ---
router.get("/vaults", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const vaults = await VaultService.getVaults(req.user?.dbId!);
    res.json(vaults.map(v => ({ ...v, balance: Number(v.balance) / 100 })));
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

router.post("/vaults", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const vault = await VaultService.createVault(req.user?.dbId!, req.body);
    res.json(vault);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

// --- AI & Finance Insights ---
router.get("/finance/ai-insights", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const insights = await AIService.getInsights(req.user?.dbId!);
    res.json(insights);
  } catch (err) { res.status(500).json({ error: "AI Service Unavailable" }); }
});

router.get("/rewards/balance", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const balance = await RewardService.getRewardBalance(req.user?.dbId!);
    res.json({ balance: Number(balance) / 100 });
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

// --- Corporate Features ---
router.get("/invoices", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const invoices = await InvoiceService.getInvoices(req.user?.dbId!);
    res.json(invoices.map(i => ({ ...i, amount: Number(i.amount) / 100 })));
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

router.get("/staff", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const staff = await StaffService.getStaff(req.user?.dbId!);
    res.json(staff);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

router.get("/approvals/pending", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const pending = await ApprovalService.getPendingApprovals(req.user?.dbId!);
    res.json(pending.map(tx => ({ ...tx, amount: Number(tx.amount) / 100 })));
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

router.get("/payment-links", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const links = await PaymentLinkService.getLinks(req.user?.dbId!);
    res.json(links.map(l => ({
      ...l,
      amount: l.amount ? Number(l.amount) / 100 : null,
      totalReceived: Number(l.totalReceived) / 100
    })));
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

export default router;
