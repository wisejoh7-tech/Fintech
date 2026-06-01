import React, { useState, useEffect, useRef, useMemo } from "react";
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  History,
  ShieldCheck,
  CreditCard,
  Send,
  Plus,
  Bell,
  User as UserIcon,
  Search,
  TrendingUp,
  X,
  CheckCircle2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  Smartphone,
  Globe,
  Gamepad2,
  Building2,
  QrCode,
  Copy,
  ShieldAlert,
  UserCog,
  Activity as ActivityIcon,
  Phone,
  RefreshCcw,
  Info,
  Eye,
  EyeOff,
  Wifi,
  Home,
  Fingerprint,
  Scan,
  Zap,
  Hash,
  FileCheck,
  Camera,
  Tv,
  Cpu,
  Moon,
  Sun
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { auth } from "./lib/firebase";
import { Capacitor } from '@capacitor/core';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { NativeBiometric } from "capacitor-native-biometric";
import {
  userService,
  transactionService,
  biometricService,
  cardService,
  activityService,
  recurringPaymentService,
  escrowService,
  billService,
  rechargeService,
  bettingService,
  investmentService,
  scanPayService,
  adminService,
  paystackService,
  storageService,
  beneficiaryService,
  vaultService,
  rewardService,
  invoiceService,
  staffService,
  approvalService,
  bulkTransferService,
  paymentLinkService
} from "./lib/services";

import { getApiUrl } from "./lib/api";
import { getSocket } from "./lib/socket";

// --- Types ---
interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  type: string;
  date: string;
  status?: string;
  traceId?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  riskLevel: string;
  is2FAEnabled: boolean;
  accountNumber: string;
  isVerified: boolean;
  phoneNumber: string;
  address?: string;
  bvn: string;
  nin?: string;
  role: 'user' | 'admin';
  tier: number;
  isBiometricEnabled: boolean;
  avatar?: string;
}

interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  date: string;
  isRead: boolean;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
];

const TIER_LIMITS = {
  1: { unverified: 50000, verified: 100000, label: "Basic" },
  2: { unverified: 500000, verified: 1000000, label: "Standard" },
  3: { unverified: 2000000, verified: 10000000, label: "Ultimate" }
};
const NIGERIAN_BANKS = [
  { name: "Viva", code: "viva" },
  { name: "Access Bank", code: "044" },
  { name: "Eco Bank", code: "050" },
  { name: "Fairmoney", code: "50839" },
  { name: "First Bank", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "Kuda Bank", code: "090267" },
  { name: "OPay", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Zenith Bank", code: "057" },
];
const getEffectiveLimit = (tier: number, isVerified: boolean) => {
  const t = (TIER_LIMITS as any)[tier] || TIER_LIMITS[1];
  return isVerified ? t.verified : t.unverified;
};

function TransactionReceiptModal({ isOpen, onClose, transaction, user }: any) {
  if (!transaction) return null;
  const isCredit = transaction.type === 'deposit' || transaction.type === 'receive' || (transaction.receiver === user?.accountNumber);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden bg-white">
              <div className="bg-primary p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black">Transaction Receipt</h3>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Viva Business Banking</p>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="text-center pb-4 border-b border-dashed">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Amount</p>
                  <h2 className={`text-3xl font-black ${isCredit ? 'text-sky-600' : 'text-slate-900'}`}>
                    {isCredit ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
                    <p className="font-black text-sky-600">SUCCESS</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Date</p>
                    <p className="font-bold">{new Date(transaction.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Type</p>
                    <p className="font-bold uppercase">{transaction.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Reference</p>
                    <p className="font-bold text-[10px]">{transaction.id?.slice(0, 12).toUpperCase() || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Recipient/Sender</p>
                    <p className="font-black">{isCredit ? transaction.sender : transaction.receiver}</p>
                  </div>
                </div>

                <div className="pt-6 space-y-2">
                  <Button className="w-full h-12 rounded-xl font-bold" onClick={() => { toast.success("Receipt downloaded as PDF"); onClose(); }}>
                    Download Receipt
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PinInputModal({ isOpen, onClose, onConfirm, title = "Enter Transaction PIN", description = "Confirm this action with your 4-digit PIN." }: any) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = [useRef<any>(null), useRef<any>(null), useRef<any>(null), useRef<any>(null)];

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index: number, e: any) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = () => {
    const pinString = pin.join("");
    if (pinString.length === 4) {
      onConfirm(pinString);
      setPin(["", "", "", ""]);
    } else {
      toast.error("Please enter a 4-digit PIN");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border-primary/20 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="text-center pt-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Lock className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-black">{title}</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground mt-2">{description}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="flex justify-center gap-3">
                  {pin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-14 h-14 text-center text-2xl font-black border-2 rounded-2xl bg-slate-50 focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <Button className="h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" onClick={handleSubmit}>
                    Confirm Transaction
                  </Button>
                  <Button variant="ghost" className="h-12 rounded-xl text-muted-foreground font-bold" onClick={() => { setPin(["", "", "", ""]); onClose(); }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Main App ---
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUSSDOpen, setIsUSSDOpen] = useState(false);
  const [isAirtimeOpen, setIsAirtimeOpen] = useState(false);
  const [airtimeMode, setAirtimeMode] = useState("Airtime");
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [billsType, setBillsType] = useState("Electricity");
  const [isBetOpen, setIsBetOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isEscrowOpen, setIsEscrowOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isScheduledOpen, setIsScheduledOpen] = useState(false);
  const [isVaultsOpen, setIsVaultsOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isPaymentLinksOpen, setIsPaymentLinksOpen] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // New Bank Essentials State
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  const [loadingStatus, setLoadingStatus] = useState("Initializing Secure Session...");

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      console.log("Running on Native Platform");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    let unsubscribeUser: any;
    let unsubscribeTx: any;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoadingStatus("Fetching Profile...");

        const { apiRequest } = await import("./lib/api");

        // Initial Fetch from Production Backend
        const fetchUserData = async () => {
          try {
            const data = await apiRequest("/api/user");
            setUser(data);
            setIsAuthenticated(true);
            setLoading(false);
          } catch (err) {
            console.error("Backend fetch failed:", err);
            // Fallback to Firestore subscription for real-time legacy updates
            unsubscribeUser = userService.subscribeToUser(firebaseUser.uid, (userData) => {
               if (userData) {
                 setUser(userData as User);
                 setIsAuthenticated(true);
               }
               setLoading(false);
            });
          }
        };

        fetchUserData();

        import("./lib/services").then(({ notificationService }) => {
          notificationService.requestPermission(firebaseUser.uid);
        });

            if (!unsubscribeTx) {
              unsubscribeTx = transactionService.subscribeToTransactions(firebaseUser.uid, (txs) => {
                setTransactions(txs as Transaction[]);
              });
            }

            // Real-time Notifications via Socket.io
            const socket = getSocket();
            socket.emit("join", firebaseUser.uid);
            socket.on("notification", (data: { title: string, body: string }) => {
              toast.info(data.title, {
                description: data.body,
              });
              onRefresh();
            });

            socket.on("new_approval_request", (data: any) => {
              toast.warning("New Approval Request", {
                description: `${data.initiator} initiated a transfer of ₦${data.amount.toLocaleString()}`,
                action: {
                  label: "Review",
                  onClick: () => setIsApprovalsOpen(true)
                }
              });
            });
          } else {
            setLoadingStatus("Profile not found.");
          }
          setLoading(false);
          clearTimeout(timer);
        });
      } else {
        setUser(null);
        setTransactions([]);
        setIsAuthenticated(false);
        setLoading(false);
        clearTimeout(timer);
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeTx) unsubscribeTx();
      }
    }, (error) => {
      console.error("Auth error:", error);
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeTx) unsubscribeTx();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      beneficiaryService.getBeneficiaries().then(setBeneficiaries).catch(console.error);
      rewardService.getBalance().then(data => setRewardBalance(data.balance)).catch(console.error);

      const fetchAccounts = async () => {
        try {
          const { apiRequest } = await import("./lib/api");
          const data = await apiRequest("/api/accounts");
          setAccounts(data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchAccounts();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const { apiRequest } = await import("./lib/api");
      const userData = await apiRequest("/api/user");
      setUser(userData);
      toast.success("Account Synced");
    } catch (err) {
      toast.error("Failed to sync with cloud");
    }
  };

  if (loading) return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center bg-background cursor-pointer"
      onClick={() => setLoading(false)}
    >
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [0.8, 1.1, 1], opacity: 1 }} transition={{ duration: 0.8 }} className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-[#0ea5e9] to-[#7c3aed] rounded-3xl flex items-center justify-center shadow-2xl">
          <span className="text-4xl font-black text-white">V</span>
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute -inset-2 border-2 border-primary/20 border-t-primary rounded-full" />
      </motion.div>
      <h2 className="mt-8 text-2xl font-black tracking-tighter bg-gradient-to-r from-[#0ea5e9] to-[#7c3aed] bg-clip-text text-transparent">Viva Mobile</h2>
      <p className="text-muted-foreground text-[10px] mt-2 font-bold uppercase tracking-widest opacity-70">{loadingStatus}</p>
      <button className="mt-8 px-4 py-2 text-[10px] border rounded-full opacity-40 hover:opacity-100 transition-opacity">Skip Loading</button>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen text-foreground font-sans selection:bg-primary/10">
        <Toaster position="top-center" richColors />

        {!isAuthenticated ? (
          isRegistering ? (
            <RegisterScreen onRegister={() => setIsRegistering(false)} onBackToLogin={() => setIsRegistering(false)} />
          ) : (
            <LoginScreen onLogin={() => setIsAuthenticated(true)} onGoToRegister={() => setIsRegistering(true)} />
          )
        ) : (
          <>
            <MainNavbar user={user} securityAlerts={securityAlerts} setIsAlertsOpen={setIsAlertsOpen} setIsSecurityModalOpen={setIsSecurityModalOpen} setIsEditProfileOpen={setIsEditProfileOpen} />

            <main className="container mx-auto px-4 py-8 max-w-7xl pb-24 md:pb-8">
              <Routes>
                <Route path="/" element={<Dashboard user={user} transactions={transactions} onRefresh={fetchData} setIsBillsOpen={setIsBillsOpen} setIsEscrowOpen={setIsEscrowOpen} setIsAirtimeOpen={setIsAirtimeOpen} setIsInvestOpen={setIsInvestOpen} setIsSecurityModalOpen={setIsSecurityModalOpen} setIsEditProfileOpen={setIsEditProfileOpen} setIsBetOpen={setIsBetOpen} setIsScanOpen={setIsScanOpen} setIsUSSDOpen={setIsUSSDOpen} setIsMoreOpen={setIsMoreOpen} setIsFundOpen={setIsFundOpen} setIsWithdrawOpen={setIsWithdrawOpen} accounts={accounts} activeAccountIndex={activeAccountIndex} setAccounts={setAccounts} setIsPinOpen={setIsPinOpen} setPendingAction={setPendingAction} beneficiaries={beneficiaries} />} />
                <Route path="/history" element={<HistoryView user={user} transactions={transactions} onRefresh={fetchData} />} />
                <Route path="/profile" element={<Profile user={user} onRefresh={fetchData} setIsUpgradeOpen={setIsUpgradeOpen} setIsSecurityModalOpen={setIsSecurityModalOpen} setIsEditProfileOpen={setIsEditProfileOpen} />} />
                <Route path="/settings" element={<AccountSettings user={user} onRefresh={fetchData} />} />
                <Route path="/cards" element={<CardsView user={user} onRefresh={fetchData} />} />
                <Route path="/admin" element={<AdminDashboard user={user} />} />
                <Route path="/kyc" element={<KYCView user={user} onRefresh={fetchData} />} />
              </Routes>
            </main>

            {/* Floating Bottom Nav */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 bg-background/90 backdrop-blur-xl border border-primary/20 z-50 px-6 py-4 rounded-[2rem] shadow-2xl mb-[env(safe-area-inset-bottom)]">
              <div className="flex justify-between items-center">
                <Link to="/" className="flex flex-col items-center gap-1 text-primary"><Home className="w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-tighter">Home</span></Link>
                <button onClick={() => setIsFundOpen(true)} className="flex flex-col items-center gap-1 text-muted-foreground"><Send className="w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-tighter">Fund</span></button>
                <div className="relative -top-10"><button onClick={() => setIsScanOpen(true)} className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#7c3aed] rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-background active:scale-90 transition-transform"><QrCode className="w-8 h-8" /></button></div>
            <Link to="/rewards" className="flex flex-col items-center gap-1 text-muted-foreground">
              <div className="relative">
                <TrendingUp className="w-6 h-6" />
                <Badge className="absolute -top-1 -right-1 p-0 w-3 h-3 flex items-center justify-center bg-red-500 text-[6px] border-none">₦</Badge>
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Rewards</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-muted-foreground"><UserIcon className="w-6 h-6" /><span className="text-[10px] font-black uppercase tracking-tighter">Account</span></Link>
          </div>
        </div>
      </>
    )}

    {/* Modals */}
    <Routes>
      <Route path="/rewards" element={<RewardsHub balance={rewardBalance} onRefresh={() => rewardService.getBalance().then(data => setRewardBalance(data.balance))} />} />
    </Routes>

        <USSDModal isOpen={isUSSDOpen} onClose={() => setIsUSSDOpen(false)} />
        <SecurityCenterModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} user={user} onRefresh={fetchData} />
        <EditProfileModal user={user} isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} onRefresh={fetchData} />
        <SecurityAlertsModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} alerts={securityAlerts} />
        <BillsModal isOpen={isBillsOpen} onClose={() => setIsBillsOpen(false)} user={user} onRefresh={fetchData} initialType={billsType} />
        <EscrowModal isOpen={isEscrowOpen} onClose={() => setIsEscrowOpen(false)} user={user} onRefresh={fetchData} />
        <UpgradeTierModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} user={user} onRefresh={fetchData} />
        <AirtimeModal isOpen={isAirtimeOpen} onClose={() => setIsAirtimeOpen(false)} user={user} onRefresh={fetchData} initialMode={airtimeMode} />
        <InvestModal isOpen={isInvestOpen} onClose={() => setIsInvestOpen(false)} user={user} onRefresh={fetchData} />
        <BetModal isOpen={isBetOpen} onClose={() => setIsBetOpen(false)} user={user} onRefresh={fetchData} />
        <ScanModal isOpen={isScanOpen} onClose={() => setIsScanOpen(false)} user={user} onRefresh={fetchData} />
        <FundModal isOpen={isFundOpen} onClose={() => setIsFundOpen(false)} user={user} onRefresh={fetchData} />
        <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} user={user} onRefresh={fetchData} />
        <ScheduledPaymentsModal isOpen={isScheduledOpen} onClose={() => setIsScheduledOpen(false)} user={user} onRefresh={fetchData} />
        <VaultsModal isOpen={isVaultsOpen} onClose={() => setIsVaultsOpen(false)} user={user} onRefresh={fetchData} />
        <InvoicesModal isOpen={isInvoicesOpen} onClose={() => setIsInvoicesOpen(false)} user={user} />
        <StaffModal isOpen={isStaffOpen} onClose={() => setIsStaffOpen(false)} user={user} />
        <ApprovalsModal isOpen={isApprovalsOpen} onClose={() => setIsApprovalsOpen(false)} user={user} onRefresh={fetchData} />
        <BulkTransferModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} user={user} onRefresh={fetchData} />
        <PaymentLinksModal isOpen={isPaymentLinksOpen} onClose={() => setIsPaymentLinksOpen(false)} user={user} />
        <TransactionReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} transaction={selectedTransaction} user={user} />
        <PinInputModal
          isOpen={isPinOpen}
          onClose={() => setIsPinOpen(false)}
          onConfirm={(pin: string) => {
            if (pendingAction) {
              pendingAction(pin);
              setIsPinOpen(false);
              setPendingAction(null);
            }
          }}
        />
        <MoreModal
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
          setters={{
            setAirtimeMode, setIsAirtimeOpen,
            setBillsType, setIsBillsOpen,
            setIsBetOpen, setIsUSSDOpen,
            setIsSecurityModalOpen, setIsFundOpen
          }}
        />
      </div>
    </Router>
  );
}

// --- Components ---

function SpendingDonut({ transactions }: { transactions: any[] }) {
  const data = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(tx => tx.type !== 'deposit' && tx.type !== 'receive').forEach(tx => {
      const cat = tx.category || 'General';
      categories[cat] = (categories[cat] || 0) + tx.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#0ea5e9', '#7c3aed', '#f59e0b', '#ef4444', '#10b981'];

  if (data.length === 0) return (
    <div className="h-[200px] flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
      No expense data yet
    </div>
  );

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer width="99%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function DashboardChart() {
  const [period, setPeriod] = useState("Daily");
  const chartData = {
    Daily: [
      { name: '08:00', amount: 1200 }, { name: '10:00', amount: 2100 }, { name: '12:00', amount: 800 },
      { name: '14:00', amount: 1600 }, { name: '16:00', amount: 900 }, { name: '18:00', amount: 1100 },
      { name: '20:00', amount: 2400 },
    ],
    Weekly: [
      { name: 'Mon', amount: 4500 }, { name: 'Tue', amount: 5200 }, { name: 'Wed', amount: 4800 },
      { name: 'Thu', amount: 6100 }, { name: 'Fri', amount: 5900 }, { name: 'Sat', amount: 7200 },
      { name: 'Sun', amount: 6800 },
    ],
    Monthly: [
      { name: 'Week 1', amount: 24000 }, { name: 'Week 2', amount: 18000 },
      { name: 'Week 3', amount: 32000 }, { name: 'Week 4', amount: 28000 },
    ]
  };

  return (
    <Card className="border shadow-sm overflow-hidden rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activity Analytics</CardTitle>
          <CardDescription className="text-xs font-black">Account Flow</CardDescription>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {["Daily", "Weekly", "Monthly"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${period === p ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}>{p}</button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="w-full pt-4">
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={(chartData as any)[period]}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} itemStyle={{ fontWeight: 'bold', color: '#0ea5e9' }} />
              <Area type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MainNavbar({ user, securityAlerts, setIsAlertsOpen, setIsSecurityModalOpen, setIsEditProfileOpen }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md px-4 py-3 border-b pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {!isHome && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-1 rounded-full bg-secondary/10 text-secondary">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 overflow-hidden group-hover:border-primary transition-colors">
                  {user?.avatar ? <img src={user.avatar} alt="P" className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 m-2.5 text-primary" />}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Business Account 👋</p>
                  <p className="text-sm font-black text-foreground">{user?.name || "Company Name"}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 mt-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}><UserCog className="mr-2 h-4 w-4" />Edit Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}><UserIcon className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive font-bold"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setIsAlertsOpen(true)}><Bell className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setIsSecurityModalOpen(true)}><ShieldCheck className="w-5 h-5 text-primary" /></Button>
        </div>
      </div>
    </nav>
  );
}

function Dashboard({
  user, transactions, onRefresh, setIsBillsOpen, setIsAirtimeOpen, setIsInvestOpen,
  setIsSecurityModalOpen, setIsEditProfileOpen, setIsBetOpen, setIsScanOpen,
  setIsUSSDOpen, setIsMoreOpen, setIsFundOpen, setIsWithdrawOpen,
  accounts, activeAccountIndex, setAccounts, setIsPinOpen, setPendingAction, beneficiaries
}: any) {
  const [showBalance, setShowBalance] = useState(true);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const categories = ["All", "Transfer", "Deposit", "Bill", "Airtime"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: Transaction) => {
      const matchesSearch =
        tx.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = activeFilter === "All" || tx.type.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchQuery, activeFilter]);

  const exportToCSV = () => {
    const headers = ["ID", "Date", "Type", "Sender", "Receiver", "Amount", "Status"];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      new Date(tx.date).toLocaleString(),
      tx.type,
      tx.sender,
      tx.receiver,
      tx.amount,
      tx.status || "success"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Viva_Statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Statement exported successfully");
  };

  const [bank, setBank] = useState(NIGERIAN_BANKS[0].name);
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code);
  const [resolvedName, setResolvedName] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);

  // Auto-resolve account name when 10 digits are typed
  useEffect(() => {
    if (recipient.length === 10 && bank !== "Viva") {
      resolveExternalAccount();
    } else if (recipient.length === 10 && bank === "Viva") {
      resolveInternalAccount();
    } else {
      setResolvedName("");
    }
  }, [recipient, bank]);

  const resolveExternalAccount = async () => {
    setIsResolving(true);
    try {
      const res = await fetch(getApiUrl(`/api/banks/resolve?accountNumber=${recipient}&bankCode=${bankCode}`));
      const data = await res.json();
      if (data.account_name) setResolvedName(data.account_name);
    } catch (e) {
      console.error("Resolve failed", e);
    } finally {
      setIsResolving(false);
    }
  };

  const resolveInternalAccount = async () => {
    setIsResolving(true);
    try {
      const recUser: any = await userService.findUserByAccountNumber(recipient);
      if (recUser) setResolvedName(recUser.name);
    } catch (e) {
      console.error("Resolve failed", e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !user) return;

    // Check for Transaction PIN
    if (!user.transactionPin) {
      toast.info("Please set your Transaction PIN in Profile > Security first.");
      return;
    }

    setPendingAction(() => async (pin: string) => {
      setIsSubmitting(true);
      try {
        const { apiRequest } = await import("./lib/api");
        await apiRequest("/api/transfer", {
          method: 'POST',
          body: JSON.stringify({
            receiver: recipient,
            amount: parseFloat(amount),
            bank,
            bankCode,
            pin,
            senderAccountId: accounts[activeAccountIndex]?.id
          })
        });

        if (saveBeneficiary) {
          await beneficiaryService.addBeneficiary({
            name: resolvedName || "Beneficiary",
            accountNumber: recipient,
            bankName: bank,
            bankCode
          }).catch(console.error);
        }

        toast.success("Transfer Successful!");
        setIsTransferOpen(false); setRecipient(""); setAmount(""); setResolvedName("");
        onRefresh();

        // Refresh accounts
        const data = await apiRequest("/api/accounts");
        setAccounts(data);
      } catch (e: any) {
        toast.error(e.message || "Transfer failed");
      }
      finally { setIsSubmitting(false); }
    });

    setIsPinOpen(true);
  };

  const handleCreateWallet = async (currency: string) => {
    try {
      const { apiRequest } = await import("./lib/api");
      await apiRequest("/api/accounts/create", {
        method: 'POST',
        body: JSON.stringify({ currency })
      });
      toast.success(`${currency} wallet created!`);
      const data = await apiRequest("/api/accounts");
      setAccounts(data);
    } catch (e) {
      toast.error("Failed to create wallet");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Multi-Currency Balance Switcher */}
      <div className="relative group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAccountIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className={`bg-gradient-to-br ${accounts[activeAccountIndex]?.currency === 'USD' ? 'from-slate-800 to-slate-950' : accounts[activeAccountIndex]?.currency === 'GBP' ? 'from-indigo-800 to-indigo-950' : 'from-[#0ea5e9] to-[#0369a1]'} text-white border-none shadow-2xl relative overflow-hidden p-6 rounded-3xl h-64 flex flex-col justify-between`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                        {accounts[activeAccountIndex]?.currency || 'NGN'} Balance
                      </p>
                      {accounts.length > 1 && (
                        <div className="flex gap-1">
                          {accounts.map((_, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${idx === activeAccountIndex ? 'bg-white' : 'bg-white/30'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <h2 className="text-4xl font-black">
                      {showBalance ? (
                        accounts[activeAccountIndex]?.currency === 'USD' ? `$${(accounts[activeAccountIndex]?.balance || 0).toLocaleString()}` :
                        accounts[activeAccountIndex]?.currency === 'GBP' ? `£${(accounts[activeAccountIndex]?.balance || 0).toLocaleString()}` :
                        `₦${(accounts[activeAccountIndex]?.balance || 0).toLocaleString()}.00`
                      ) : "****"}
                    </h2>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Acc: {accounts[activeAccountIndex]?.accountNumber || user?.accountNumber}</p>
                      <button onClick={() => { navigator.clipboard.writeText(accounts[activeAccountIndex]?.accountNumber); toast.success("Copied!"); }} className="hover:text-white transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setShowBalance(!showBalance)} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">{showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}</button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => setActiveAccountIndex((activeAccountIndex + 1) % accounts.length)}
                        className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20 active:scale-95 transition-transform"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 relative z-10">
                <ActionItem icon={<Plus />} label="Fund" onClick={() => setIsFundOpen(true)} />
                <ActionItem icon={<Send />} label="Send" onClick={() => setIsTransferOpen(true)} />
                <ActionItem icon={<ArrowUpRight />} label="Withdraw" onClick={() => setIsWithdrawOpen(true)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20"><Globe className="w-5 h-5" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Wallets</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Create Wallet</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleCreateWallet('USD')} disabled={accounts.some(a => a.currency === 'USD')}>US Dollar ($)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateWallet('GBP')} disabled={accounts.some(a => a.currency === 'GBP')}>British Pound (£)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateWallet('EUR')} disabled={accounts.some(a => a.currency === 'EUR')}>Euro (€)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        <ServiceIcon icon={<Smartphone className="text-blue-500" />} label="Airtime" onClick={() => setIsAirtimeOpen(true)} />
        <ServiceIcon icon={<Globe className="text-sky-500" />} label="Data" onClick={() => setIsAirtimeOpen(true)} />
        <ServiceIcon icon={<Building2 className="text-orange-500" />} label="Bills" onClick={() => setIsBillsOpen(true)} />
        <ServiceIcon icon={<Gamepad2 className="text-purple-500" />} label="Betting" onClick={() => {}} />
        <ServiceIcon icon={<QrCode className="text-slate-700" />} label="Scan" onClick={() => setIsScanOpen(true)} />
        <ServiceIcon icon={<TrendingUp className="text-red-500" />} label="Invest" onClick={() => setIsInvestOpen(true)} />
        <ServiceIcon icon={<RefreshCcw className="text-emerald-500" />} label="Schedule" onClick={() => setIsScheduledOpen(true)} />
        <ServiceIcon icon={<TrendingUp className="text-orange-500" />} label="Vaults" onClick={() => setIsVaultsOpen(true)} />
        <ServiceIcon icon={<FileCheck className="text-blue-600" />} label="Invoices" onClick={() => setIsInvoicesOpen(true)} />
        <ServiceIcon icon={<UserCog className="text-slate-900" />} label="Team" onClick={() => setIsStaffOpen(true)} />
        <ServiceIcon icon={<ShieldCheck className="text-amber-600" />} label="Approvals" onClick={() => setIsApprovalsOpen(true)} />
        <ServiceIcon icon={<ArrowUpRight className="text-purple-600" />} label="Bulk" onClick={() => setIsBulkOpen(true)} />
        <ServiceIcon icon={<Globe className="text-sky-600" />} label="Checkout" onClick={() => setIsPaymentLinksOpen(true)} />
        <ServiceIcon icon={<Hash className="text-indigo-500" />} label="USSD" onClick={() => setIsUSSDOpen(true)} />
        <ServiceIcon icon={<Plus className="text-slate-400" />} label="More" onClick={() => setIsMoreOpen(true)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardChart />
        <Card className="border shadow-sm p-6 rounded-3xl">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Spending by Category</CardTitle>
          <SpendingDonut transactions={transactions} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIInsightsSection userId={user?.id} />
        <div className="space-y-6">
           <Card className="border shadow-sm p-6 rounded-3xl">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Data Plans</CardTitle>
              <div className="space-y-3">
                {[ {n: "Daily", d: "1GB / 24hrs", p: 300}, {n: "Weekly", d: "6GB / 7 Days", p: 1500}, {n: "Monthly", d: "20GB / 30 Days", p: 5000} ].map(plan => (
                  <div key={plan.n} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setIsAirtimeOpen(true)}>
                    <div><p className="font-bold text-sm">{plan.n} Plan</p><p className="text-[10px] text-muted-foreground font-medium">{plan.d}</p></div>
                    <Badge className="bg-primary/10 text-primary border-none font-black">₦{plan.p}</Badge>
                  </div>
                ))}
              </div>
           </Card>
           <Card className="bg-primary/5 border-primary/20 p-6 rounded-[2rem] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-primary mb-1">Business Credit Score</p>
                <h3 className="text-2xl font-black text-slate-900">742 / 850</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Excellent Ranking</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-emerald-600">
                87%
              </div>
           </Card>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between w-full">
            <div>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Activity Ledger</CardDescription>
            </div>
            <div className=\"flex gap-2\">
              <Button variant=\"outline\" size=\"sm\" onClick={exportToCSV} className=\"rounded-xl h-8 px-3 text-[10px] font-black uppercase\">
                <ArrowDownLeft className=\"w-3 h-3 mr-1\" /> Export
              </Button>
              <Link to=\"/history\" className=\"flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline\">View All <ChevronRight className=\"w-3 h-3\" /></Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, account or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeFilter === cat
                  ? "bg-primary text-white shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 mx-auto text-muted-foreground opacity-20 mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No matching transactions found</p>
            </div>
          ) : (
            filteredTransactions.slice(0, 5).map((tx: any) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-3 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedTransaction(tx); setIsReceiptOpen(true); }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-600'}`}>
                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[150px]">{tx.receiver === user?.accountNumber ? tx.sender : tx.receiver}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`font-black ${tx.type === 'deposit' ? 'text-sky-600' : 'text-slate-900'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

          <AnimatePresence>
        {isTransferOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
              <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>Send Money</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsTransferOpen(false)}><X className="w-4 h-4" /></Button>
                  </div>
                  <CardDescription>Transfer to Viva or other banks.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {beneficiaries.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Saved Beneficiaries</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {beneficiaries.map(b => (
                          <button
                            key={b.id}
                            onClick={() => { setRecipient(b.accountNumber); setBank(b.bankName); }}
                            className="flex flex-col items-center gap-1 min-w-[70px]"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {b.name.charAt(0)}
                            </div>
                            <span className="text-[9px] font-bold text-center truncate w-full">{b.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Destination Bank</label>
                      <select
                        value={bank}
                        onChange={e => {
                          const selectedBank = NIGERIAN_BANKS.find(b => b.name === e.target.value);
                          setBank(e.target.value);
                          setBankCode(selectedBank?.code || "");
                        }}
                        className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary transition-colors font-medium"
                      >
                        {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Number</label>
                      <div className="relative">
                        <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0000000000" className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary transition-colors font-medium" maxLength={10} />
                        {isResolving && <RefreshCcw className="absolute right-4 top-4 w-5 h-5 animate-spin text-primary" />}
                      </div>
                      {resolvedName && <p className="text-[10px] font-bold text-sky-600 uppercase ml-1 mt-1">✓ {resolvedName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount (₦)</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary transition-colors font-black text-xl" />
                    </div>

                    <div className="flex items-center gap-2 p-2">
                      <input
                        type="checkbox"
                        id="saveBen"
                        checked={saveBeneficiary}
                        onChange={(e) => setSaveBeneficiary(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="saveBen" className="text-xs font-bold text-slate-600">Save as beneficiary</label>
                    </div>
                  </div>

                  <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" onClick={handleTransfer} disabled={isSubmitting}>
                    {isSubmitting ? "Initialising..." : "Send Money"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryView({ user, transactions, onRefresh }: any) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const categories = ["All", "Transfer", "Deposit", "Bill", "Airtime"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: Transaction) => {
      const matchesSearch =
        tx.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = activeFilter === "All" || tx.type.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchQuery, activeFilter]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-black">Transaction History</h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeFilter === cat
                ? "bg-primary text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-0 divide-y">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                <History className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-600'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm truncate max-w-[200px]">{tx.receiver === user?.accountNumber ? tx.sender : tx.receiver}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">{new Date(tx.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'deposit' ? 'text-sky-600' : 'text-slate-900'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{tx.status || 'Success'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onGoToRegister }: any) {
  const [email, setEmail] = useState(localStorage.getItem("viva_last_email") || "demo@viva.com");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { toast.error("Please fill in all fields"); return; }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem("viva_last_email", email);
      localStorage.setItem("viva_biometric_active", "true");
      onLogin();
    } catch (e: any) { toast.error(e.message || "Login Failed"); }
    finally { setIsSubmitting(false); }
  };

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem("viva_last_email");
    if (!localStorage.getItem("viva_biometric_active") || !savedEmail) { toast.error("Please log in with password once to enable biometrics"); return; }
    if (!Capacitor.isNativePlatform()) { toast.info("Biometric login is only available on native devices"); return; }
    try {
      const resultAvailable = await NativeBiometric.isAvailable();
      if (!resultAvailable.isAvailable) { toast.error("Biometrics not available on this device"); return; }
      await NativeBiometric.verifyIdentity({ reason: "Log in to Viva Mobile", title: "Security Verification", subtitle: "Use biometrics to authenticate", description: "Please verify your identity to continue to your account" });
      setIsBiometricScanning(true);
      toast.success("Identity Verified Successfully");
      onLogin();
    } catch (e: any) { if (e.message !== "user cancelled") toast.error("Biometric Authentication Failed"); }
    finally { setIsBiometricScanning(false); }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-cover bg-center relative gap-6" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601597111158-2fcee27173bd?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl relative">
          <span className="text-4xl font-black text-white">V</span>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full border-4 border-slate-50 flex items-center justify-center"><ShieldCheck className="w-3 h-3 text-white" /></div>
        </motion.div>
        <div className="text-center"><h1 className="text-2xl font-black tracking-tight">Viva Business</h1><p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Corporate Digital Banking</p></div>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="w-full space-y-4">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Email</label>
            <div className="relative"><Mail className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full p-4 pl-12 border-2 rounded-2xl bg-white outline-none focus:border-primary/30 transition-colors font-medium" required /></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure PIN / Password</label>
            <div className="relative"><Lock className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="w-full p-4 pl-12 pr-12 border-2 rounded-2xl bg-white outline-none focus:border-primary/30 transition-colors font-medium" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2"><Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" disabled={isSubmitting || isBiometricScanning}>{isSubmitting ? "Authenticating..." : "Sign In Securely"}</Button>
            <div className="relative flex items-center py-4"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink mx-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Quick Access</span><div className="flex-grow border-t border-slate-200"></div></div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-16 rounded-2xl border-2 border-primary/10 bg-white hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group" onClick={handleBiometricLogin} disabled={isSubmitting || isBiometricScanning}><Fingerprint className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase tracking-tighter">Touch ID</span></Button>
              <Button type="button" variant="outline" className="h-16 rounded-2xl border-2 border-primary/10 bg-white hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group" onClick={() => onGoToRegister()} disabled={isSubmitting || isBiometricScanning}><Scan className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase tracking-tighter">Face ID</span></Button>
            </div>
          </div>
        </form>
        <button type="button" onClick={onGoToRegister} className="w-full text-center text-[10px] font-black text-muted-foreground mt-4 hover:text-primary transition-colors uppercase tracking-widest">No account? <span className="text-primary">Create one now</span></button>
      </div>
      {isBiometricScanning && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl"><div className="relative"><motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-32 h-32 rounded-full border-4 border-primary/10 border-t-primary" /><div className="absolute inset-0 flex items-center justify-center"><Fingerprint className="w-12 h-12 text-primary animate-pulse" /></div></div><div className="text-center mt-8 space-y-2"><h3 className="text-xl font-black tracking-tight">Biometric Verification</h3><p className="text-sm text-muted-foreground font-medium">Scanning for Touch ID / Face ID</p></div><Button variant="ghost" className="mt-12 text-muted-foreground font-bold" onClick={() => setIsBiometricScanning(false)}>Cancel Scan</Button></motion.div>)}
    </div>
  );
}

function RegisterScreen({ onRegister, onBackToLogin }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReg = async () => {
    if (!name || !email || !pass || !confirmPass || !phone) { toast.error("Please fill in all fields"); return; }
    if (pass !== confirmPass) { toast.error("Passwords do not match"); return; }
    if (pass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsSubmitting(true);
    try {
      const r = await createUserWithEmailAndPassword(auth, email, pass);

      // 1. Create Firestore Profile (Legacy/Redundancy)
      await userService.createUserProfile(r.user.uid, { name, email, phoneNumber: phone, isBiometricEnabled: enableBiometrics });

      // 2. Sync to Production PostgreSQL Backend
      const { apiRequest } = await import("./lib/api");
      await apiRequest("/api/auth/sync", {
        method: 'POST',
        body: JSON.stringify({ name, phoneNumber: phone })
      });

      if (enableBiometrics) { localStorage.setItem("viva_biometric_active", "true"); localStorage.setItem("viva_last_email", email); }
      toast.success("Account created successfully!");
      onRegister();
    } catch (e: any) { toast.error(e.message || "Registration Failed"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-cover bg-center relative gap-6 overflow-y-auto" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=2071&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shrink-0"><span className="text-3xl font-black text-white">V</span></div>
        <div className="text-center"><h1 className="text-2xl font-black">Create Account</h1><p className="text-xs text-muted-foreground font-medium mt-1">Start your secure banking journey</p></div>
        <div className="w-full space-y-4">
          <div className="relative"><UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full p-4 pl-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full p-4 pl-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="relative"><Phone className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-4 pl-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Create PIN/Password" className="w-full p-4 pl-10 pr-12 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          </div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm PIN/Password" className="w-full p-4 pl-10 pr-12 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3"><Fingerprint className="w-5 h-5 text-primary" /><div><p className="text-xs font-bold">Enable Biometric Login</p><p className="text-[10px] text-muted-foreground">Fingerprint / Face ID</p></div></div>
            <input type="checkbox" checked={enableBiometrics} onChange={e => setEnableBiometrics(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer" />
          </div>
          <Button onClick={handleReg} className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>{isSubmitting ? "Creating Account..." : "Register"}</Button>
          <button onClick={onBackToLogin} className="w-full text-center text-sm font-bold text-muted-foreground mt-2 hover:text-primary transition-colors">Already have an account? Login</button>
        </div>
      </div>
    </div>
  );
}

function Profile({ user, setIsUpgradeOpen, setIsSecurityModalOpen, setIsEditProfileOpen }: any) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden group-hover:border-primary transition-colors">
            {user?.avatar ? <img src={user.avatar} alt="P" className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-primary" />}
          </div>
          <button onClick={() => setIsEditProfileOpen(true)} className="absolute bottom-0 right-0 p-1.5 bg-sky-500 text-white rounded-full border-2 border-background shadow-lg scale-90 group-hover:scale-100 transition-transform"><Camera className="w-3 h-3" /></button>
        </div>
        <div><h2 className="text-2xl font-bold">{user?.name}</h2><p className="text-muted-foreground text-sm font-medium">{user?.phoneNumber}</p><p className="text-muted-foreground text-xs opacity-70">Acc: {user?.accountNumber}</p>
          <div className="flex gap-2 mt-3 justify-center"><Badge variant={user?.isVerified ? "default" : "secondary"}>{user?.isVerified ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}{user?.isVerified ? 'Verified' : 'Unverified'}</Badge><Badge variant="outline" className="border-primary text-primary">Tier {user?.tier || 1}</Badge></div>
        </div>
      </div>
      <div className="space-y-3">
        <ProfileItem icon={<UserIcon />} label="Edit Profile & Address" onClick={() => setIsEditProfileOpen(true)} />
        <ProfileItem icon={<FileCheck />} label="KYC (BVN/NIN Verification)" onClick={() => navigate("/kyc")} />
        <ProfileItem icon={<ShieldCheck />} label="Security Center" onClick={() => setIsSecurityModalOpen(true)} />
        <ProfileItem icon={<Zap />} label="Upgrade Account Tier" onClick={() => setIsUpgradeOpen(true)} />
        <ProfileItem icon={<Info />} label="Help Center" onClick={() => toast.info("Help Center: 08183793358")} />
        <Button variant="destructive" className="w-full mt-6 h-12 rounded-xl font-bold" onClick={() => signOut(auth)}><LogOut className="w-4 h-4 mr-2" /> Log Out</Button>
      </div>
    </div>
  );
}

function ActionItem({ icon, label, onClick }: any) { return (<button onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20">{icon}</div><span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{label}</span></button>); }
function ServiceIcon({ icon, label, onClick }: any) { return (<button onClick={onClick} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-primary/30 transition-all">{icon}</div><span className="text-[10px] font-bold uppercase tracking-tighter text-slate-600">{label}</span></button>); }
function ProfileItem({ icon, label, onClick }: any) { return (<button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-xl border bg-white hover:bg-slate-50 transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">{icon}</div><span className="font-bold">{label}</span></div><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>); }

function ScheduledPaymentsModal({ isOpen, onClose, user, onRefresh }: any) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    amount: "",
    receiver: "",
    bank: "Viva",
    frequency: "MONTHLY",
    description: "",
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) fetchPayments();
  }, [isOpen]);

  const fetchPayments = async () => {
    try {
      const data = await recurringPaymentService.getScheduledPayments();
      setPayments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await recurringPaymentService.schedulePayment({
        ...form,
        amount: parseFloat(form.amount)
      });
      toast.success("Payment scheduled successfully!");
      setIsCreateOpen(false);
      fetchPayments();
    } catch (e) {
      toast.error("Failed to schedule payment");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await recurringPaymentService.cancelScheduledPayment(id);
      toast.success("Payment cancelled");
      fetchPayments();
    } catch (e) {
      toast.error("Failed to cancel payment");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black">Scheduled Payments</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Automated Corporate Payroll</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Frequency</label>
                      <select
                        value={form.frequency}
                        onChange={e => setForm({...form, frequency: e.target.value})}
                        className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary font-bold"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly (Payroll/Rent)</option>
                      </select>
                    </div>
                    <input
                      value={form.receiver}
                      onChange={e => setForm({...form, receiver: e.target.value})}
                      placeholder="Recipient Account"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({...form, amount: e.target.value})}
                        placeholder="Amount ₦"
                        className="p-4 border-2 rounded-2xl font-black"
                      />
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm({...form, startDate: e.target.value})}
                        className="p-4 border-2 rounded-2xl"
                      />
                    </div>
                    <input
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Description (e.g. Employee Salary)"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Schedule Now</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl font-bold">
                      <Plus className="w-4 h-4 mr-2" /> Add New Automation
                    </Button>

                    {loading ? (
                      <div className="py-10 text-center opacity-50 text-[10px] font-black">Loading Automations...</div>
                    ) : payments.length === 0 ? (
                      <div className="py-10 text-center opacity-30 italic text-sm">No scheduled payments yet</div>
                    ) : (
                      payments.map(p => (
                        <div key={p.id} className="p-4 border-2 rounded-2xl flex justify-between items-center bg-slate-50">
                          <div>
                            <p className="font-black text-sm">{p.description || 'Auto Transfer'}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.frequency} • Next: {new Date(p.nextRun).toLocaleDateString()}</p>
                            <p className="text-primary font-black mt-1">₦{p.amount.toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleCancel(p.id)} className="text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function BulkTransferModal({ isOpen, onClose, user, onRefresh }: any) {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ accountNumber: "", bank: "Viva", amount: "", name: "" });

  const addRecipient = () => {
    if (!form.accountNumber || !form.amount) return;
    setRecipients([...recipients, { ...form, id: Date.now() }]);
    setForm({ accountNumber: "", bank: "Viva", amount: "", name: "" });
  };

  const handleBulkSend = async (pin: string) => {
    setIsSubmitting(true);
    try {
      await bulkTransferService.processBulkTransfer({ recipients, pin });
      toast.success(`Processing ${recipients.length} transfers in background!`);
      setRecipients([]);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Bulk transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[85vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Bulk Transfer</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <CardDescription className="text-[10px] font-bold uppercase">Payroll & Batch Payments</CardDescription>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-black uppercase text-primary">Add Recipient</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} placeholder="Account Number" className="p-3 text-xs border-2 rounded-xl" />
                    <select value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} className="p-3 text-xs border-2 rounded-xl bg-white">
                      {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount ₦" className="flex-1 p-3 text-xs border-2 rounded-xl font-black" />
                    <Button size="sm" onClick={addRecipient} className="rounded-xl h-10 px-4"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Recipient List ({recipients.length})</p>
                  {recipients.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground italic">Add accounts to start batch</p>
                  ) : (
                    <div className="space-y-2">
                      {recipients.map((r, i) => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border">
                          <div>
                            <p className="font-bold text-xs">{r.accountNumber} ({r.bank})</p>
                            <p className="text-primary font-black text-sm">₦{parseFloat(r.amount).toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))} className="text-destructive"><X className="w-3 h-3" /></Button>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-dashed">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-xs font-bold uppercase">Total Batch</p>
                          <p className="text-lg font-black">₦{recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</p>
                        </div>
                        <Button className="w-full h-12 rounded-xl font-black" onClick={() => setIsPinOpen(true)} disabled={isSubmitting}>
                          {isSubmitting ? "Processing..." : "Process Batch Transfer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <PinInputModal isOpen={isPinOpen} onClose={() => setIsPinOpen(false)} onConfirm={handleBulkSend} title="Confirm Batch" description="Enter PIN to authorize bulk payout." />
        </div>
      )}
    </AnimatePresence>
  );
}

function PaymentLinksModal({ isOpen, onClose, user }: any) {
  const [links, setLinks] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", amount: "", description: "" });

  useEffect(() => { if (isOpen) fetchLinks(); }, [isOpen]);
  const fetchLinks = async () => { try { const data = await paymentLinkService.getPaymentLinks(); setLinks(data); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const handleCreate = async () => {
    try {
      await paymentLinkService.createPaymentLink({ ...form, amount: form.amount ? parseFloat(form.amount) : undefined });
      toast.success("Payment link created!");
      setIsCreateOpen(false);
      fetchLinks();
    } catch (e) { toast.error("Failed to create link"); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Payment Links</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <CardDescription className="text-[10px] font-bold uppercase">Collect money from anyone</CardDescription>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Link Title (e.g. Consulting Fee)" className="w-full p-4 border-2 rounded-2xl" />
                    <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Fixed Amount ₦ (Optional)" className="w-full p-4 border-2 rounded-2xl font-black" />
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full p-4 border-2 rounded-2xl" />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Create Link</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} className="w-full h-14 rounded-2xl font-bold bg-sky-600 shadow-lg shadow-sky-600/20"><Link className="w-4 h-4 mr-2" /> Create New Payment Link</Button>
                    {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Loading Links...</div> : links.map(l => (
                      <div key={l.id} className="p-5 border-2 rounded-2xl bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-sm">{l.title}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{l.amount ? `₦${l.amount.toLocaleString()}` : 'Flexible Amount'}</p>
                          </div>
                          <Badge className="bg-sky-100 text-sky-700 border-none font-black text-[8px]">ACTIVE</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 h-9 rounded-lg text-[10px] font-black uppercase" onClick={() => { navigator.clipboard.writeText(`https://viva.ng/pay/${l.linkId}`); toast.success("Link copied!"); }}>Copy Link</Button>
                          <Button variant="secondary" className="flex-1 h-9 rounded-lg text-[10px] font-black uppercase">Share</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ApprovalsModal({ isOpen, onClose, user, onRefresh }: any) {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => { if (isOpen) fetchPending(); }, [isOpen]);
  const fetchPending = async () => { try { const data = await approvalService.getPendingApprovals(); setPending(data); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const handleApprove = async (pin: string) => {
    try {
      await approvalService.approveTransaction(selectedId, pin);
      toast.success("Transaction approved!");
      setIsPinOpen(false);
      fetchPending();
      onRefresh();
    } catch (e: any) { toast.error(e.message || "Approval failed"); }
  };

  const handleDecline = async (id: string) => {
    try {
      await approvalService.declineTransaction(id);
      toast.info("Transaction declined");
      fetchPending();
    } catch (e) { toast.error("Action failed"); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black">Transaction Approvals</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Corporate Governance</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Scanning Requests...</div> : pending.length === 0 ? (
                  <div className="py-10 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-20" />
                    <p className="text-muted-foreground text-sm font-medium">All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map(tx => (
                      <div key={tx.id} className="p-5 border-2 rounded-2xl bg-white space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Awaiting Approval</p>
                            <p className="font-black text-lg">₦{tx.amount.toLocaleString()}</p>
                          </div>
                          <Badge variant="outline" className="border-amber-500 text-amber-500 font-black">PENDING</Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-600">{tx.description}</p>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1 h-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 font-bold" onClick={() => handleDecline(tx.id)}>Decline</Button>
                          <Button className="flex-1 h-10 rounded-xl font-bold" onClick={() => { setSelectedId(tx.id); setIsPinOpen(true); }}>Approve</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <PinInputModal isOpen={isPinOpen} onClose={() => setIsPinOpen(false)} onConfirm={handleApprove} title="Confirm Approval" description="Enter your Transaction PIN to authorize this transfer." />
        </div>
      )}
    </AnimatePresence>
  );
}

function InvoicesModal({ isOpen, onClose, user }: any) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", amount: "", dueDate: "", description: "" });

  useEffect(() => { if (isOpen) fetchInvoices(); }, [isOpen]);
  const fetchInvoices = async () => { try { const data = await invoiceService.getInvoices(); setInvoices(data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const handleCreate = async () => { try { await invoiceService.createInvoice({ ...form, amount: parseFloat(form.amount) }); toast.success("Invoice sent to client!"); setIsCreateOpen(false); fetchInvoices(); } catch (e) { toast.error("Failed to create invoice"); } };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Invoices</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <input value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} placeholder="Client Name" className="w-full p-4 border-2 rounded-2xl" />
                    <input value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="Client Email" className="w-full p-4 border-2 rounded-2xl" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount ₦" className="p-4 border-2 rounded-2xl font-black" />
                      <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="p-4 border-2 rounded-2xl" />
                    </div>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Project Description" className="w-full p-4 border-2 rounded-2xl min-h-[100px]" />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Create & Send</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl font-bold"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
                    {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Loading...</div> : invoices.map(i => (
                      <div key={i.id} className="p-4 border-2 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div>
                          <p className="font-black text-sm">{i.clientName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Due: {new Date(i.dueDate).toLocaleDateString()} • {i.status}</p>
                          <p className="text-primary font-black mt-1">₦{i.amount.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className={i.status === 'PAID' ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}>{i.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StaffModal({ isOpen, onClose, user }: any) {
  const [staff, setStaff] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", role: "VIEWER" });

  useEffect(() => { if (isOpen) fetchStaff(); }, [isOpen]);
  const fetchStaff = async () => { try { const data = await staffService.getStaff(); setStaff(data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const handleAdd = async () => { try { await staffService.addStaff(form); toast.success("Staff member invited!"); setIsAddOpen(false); fetchStaff(); } catch (e) { toast.error("Failed to add staff"); } };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Team Access</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {isAddOpen ? (
                  <div className="space-y-4">
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" className="w-full p-4 border-2 rounded-2xl" />
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Corporate Email" className="w-full p-4 border-2 rounded-2xl" />
                    <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full p-4 border-2 rounded-2xl bg-white">
                      <option value="VIEWER">Viewer (Read Only)</option>
                      <option value="INITIATOR">Initiator (Create Transfers)</option>
                      <option value="ADMIN">Co-Admin (Full Access)</option>
                    </select>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsAddOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleAdd}>Invite Staff</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsAddOpen(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl font-bold"><Plus className="w-4 h-4 mr-2" /> Add Team Member</Button>
                    {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Loading...</div> : staff.map(s => (
                      <div key={s.id} className="p-4 border-2 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-black text-sm">{s.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.role}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[8px] font-black">{s.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function VaultsModal({ isOpen, onClose, user, onRefresh }: any) {
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVault, setSelectedCard] = useState<any>(null); // Reusing UI pattern
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    category: "SAVINGS",
    lockUntil: "",
  });

  useEffect(() => {
    if (isOpen) fetchVaults();
  }, [isOpen]);

  const fetchVaults = async () => {
    try {
      const data = await vaultService.getVaults();
      setVaults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await vaultService.createVault({
        ...form,
        targetAmount: form.targetAmount ? parseFloat(form.targetAmount) : undefined,
        interestRate: 8.5 // Default corporate interest rate
      });
      toast.success("Vault created! Earning 8.5% p.a.");
      setIsCreateOpen(false);
      fetchVaults();
    } catch (e) {
      toast.error("Failed to create vault");
    }
  };

  const handleAction = async (action: 'fund' | 'withdraw') => {
    if (!selectedVault || !amount) return;
    setIsProcessing(true);
    try {
      if (action === 'fund') {
        await vaultService.fundVault(selectedVault.id, parseFloat(amount));
        toast.success("Vault funded successfully");
      } else {
        await vaultService.withdrawFromVault(selectedVault.id, parseFloat(amount));
        toast.success("Withdrawn to main account");
      }
      setAmount("");
      setSelectedCard(null);
      fetchVaults();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[85vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black">Savings Vaults</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Corporate Treasury & Interest</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <input
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Vault Name (e.g. Q4 Taxes)"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <select
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full p-4 border-2 rounded-2xl bg-white"
                    >
                      <option value="SAVINGS">General Savings (8.5% p.a)</option>
                      <option value="TAX">Tax Reserve</option>
                      <option value="EMERGENCY">Emergency Fund</option>
                    </select>
                    <input
                      type="number"
                      value={form.targetAmount}
                      onChange={e => setForm({...form, targetAmount: e.target.value})}
                      placeholder="Target Amount (Optional)"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Lock Until (Optional)</label>
                      <input
                        type="date"
                        value={form.lockUntil}
                        onChange={e => setForm({...form, lockUntil: e.target.value})}
                        className="w-full p-4 border-2 rounded-2xl"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Create Vault</Button>
                    </div>
                  </div>
                ) : selectedVault ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-primary text-white rounded-[2rem] text-center">
                      <p className="text-[10px] font-black uppercase opacity-60">{selectedVault.name}</p>
                      <h2 className="text-3xl font-black mt-2">₦{selectedVault.balance.toLocaleString()}</h2>
                      <p className="text-[10px] font-bold mt-2">Interest: {selectedVault.interestRate}% p.a.</p>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-6 border-2 rounded-2xl text-center text-2xl font-black"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-14 rounded-2xl font-bold" onClick={() => handleAction('fund')} disabled={isProcessing}>
                          Fund Vault
                        </Button>
                        <Button className="h-14 rounded-2xl font-bold" onClick={() => handleAction('withdraw')} disabled={isProcessing}>
                          Withdraw
                        </Button>
                      </div>
                      <Button variant="ghost" className="w-full" onClick={() => setSelectedCard(null)}>Back to list</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/10">
                      <Plus className="w-4 h-4 mr-2" /> Open New Vault
                    </Button>

                    {loading ? (
                      <div className="py-10 text-center opacity-50 text-[10px] font-black">Scanning Vaults...</div>
                    ) : vaults.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <TrendingUp className="w-10 h-10 mx-auto opacity-10" />
                        <p className="text-muted-foreground text-sm">No vaults active</p>
                      </div>
                    ) : (
                      vaults.map(v => (
                        <div
                          key={v.id}
                          onClick={() => setSelectedCard(v)}
                          className="p-5 border-2 rounded-[1.5rem] flex justify-between items-center bg-slate-50 hover:border-primary/30 transition-all cursor-pointer group"
                        >
                          <div>
                            <p className="font-black text-sm">{v.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{v.category} • {v.interestRate}% Interest</p>
                            <p className="text-primary font-black mt-2 text-lg">₦{v.balance.toLocaleString()}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function RewardsHub({ balance, onRefresh }: any) {
  const navigate = useNavigate();
  const [refCode, setRefCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await rewardService.applyReferral(refCode);
      toast.success("Bonus claimed!");
      onRefresh();
      setRefCode("");
    } catch (e: any) {
      toast.error(e.message || "Invalid code");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background">
      <div className="max-w-md mx-auto h-full flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-slate-100"><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-xl font-black">Rewards Hub</h2>
        </div>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Cash Earned</p>
          <h2 className="text-4xl font-black mt-2">₦{balance.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 bg-white/20 w-fit px-4 py-2 rounded-full border border-white/20">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">0.5% Cashback active</span>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Claim Referral Bonus</h3>
            <div className="flex gap-2">
              <input
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="Enter referral code"
                className="flex-1 p-4 border-2 rounded-2xl bg-white outline-none focus:border-emerald-500 font-bold"
              />
              <Button onClick={handleApply} disabled={isApplying || !refCode} className="h-14 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
                {isApplying ? "..." : "Claim"}
              </Button>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Smartphone className="text-emerald-600" />
              </div>
              <div>
                <p className="font-black text-sm">Convert to Airtime</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Instant payout to your phone</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl font-bold border-emerald-100 text-emerald-700 hover:bg-emerald-50">Redeem Rewards</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function USSDModal({ isOpen, onClose }: any) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isDialing, setIsDialing] = useState(false);

  const dial = async () => {
    setIsDialing(true);
    try {
      const res = await fetch(getApiUrl("/api/ussd/process"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: "+234 812 345 6789", text: input })
      });
      const text = await res.text();
      setResponse(text);
    } catch (e) {
      toast.error("USSD Network Error");
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[300px]">
            <div className="bg-[#2c2c2e] text-white p-6 rounded-3xl shadow-2xl font-sans">
              {response ? (
                <div className="space-y-6">
                  <p className="whitespace-pre-line text-sm leading-relaxed">{response.replace('CON ', '').replace('END ', '')}</p>
                  <div className="flex gap-2">
                    {response.startsWith('CON') && (
                      <input
                        className="flex-1 bg-transparent border-b border-white/20 p-1 text-white outline-none"
                        autoFocus
                      />
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-sky-400 font-bold"
                      onClick={() => { setResponse(null); setInput(""); onClose(); }}
                    >
                      {response.startsWith('CON') ? 'Send' : 'OK'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="*819#"
                    className="w-full bg-transparent border-b border-white/20 p-2 text-center text-2xl font-bold text-white outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1 text-white/40" onClick={onClose}>Cancel</Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                      onClick={dial}
                      disabled={isDialing || !input}
                    >
                      {isDialing ? "..." : "Dial"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function WithdrawModal({ isOpen, onClose, user, onRefresh }: any) {
  const [bank, setBank] = useState("");
  const [accNum, setAccNum] = useState("");
  const [amount, setAmount] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [accName, setAccName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleVerify = async () => { if (accNum.length === 10 && bank) { setIsVerifying(true); try { const res = await paystackService.verifyAccount(accNum, bank); setAccName(res.account_name); } catch (e) { toast.error("Account verification failed"); } finally { setIsVerifying(false); } } };
  const handleWithdraw = async () => {
    if (!user || !amount || !accNum || !bank) return;
    if (parseFloat(amount) > user.balance) { toast.error("Insufficient balance"); return; }
    setIsSubmitting(true);
    try { await paystackService.requestWithdrawal(user.id, { amount: parseFloat(amount), bankName: bank, accountNumber: accNum, accountName: accName || "Verified User", sender: user.accountNumber }); await userService.updateBalance(user.id, -parseFloat(amount)); toast.success("Withdrawal request successful!"); onRefresh(); onClose(); } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); }
  };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20"><CardHeader><CardTitle>Withdraw Funds</CardTitle><CardDescription>Transfer to your personal bank account.</CardDescription></CardHeader><CardContent className="space-y-4"><select value={bank} onChange={e => setBank(e.target.value)} className="w-full p-4 border rounded-xl bg-background"><option value="">Select Target Bank</option>{NIGERIAN_BANKS.slice(1).map(b => <option key={b} value={b}>{b}</option>)}</select><div className="relative"><input value={accNum} onChange={e => setAccNum(e.target.value)} onBlur={handleVerify} placeholder="10-Digit Account Number" className="w-full p-4 border rounded-xl bg-background" maxLength={10} />{isVerifying && <RefreshCcw className="absolute right-4 top-4 w-5 h-5 animate-spin text-primary" />}</div>{accName && <p className="text-[10px] font-bold text-sky-600 uppercase ml-1">Account Name: {accName}</p>}<input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₦)" className="w-full p-4 border rounded-xl bg-background" /><div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={handleWithdraw} disabled={isSubmitting || !accName}>Withdraw Now</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function SecurityCenterModal({ isOpen, onClose, user, onRefresh }: any) {
  const [isBio, setIsBio] = useState(user?.isBiometricEnabled || false);
  const [is2FA, setIs2FA] = useState(user?.is2FAEnabled || false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [newPin, setNewPin] = useState("");

  useEffect(() => { setIsBio(user?.isBiometricEnabled || false); setIs2FA(user?.is2FAEnabled || false); }, [user]);

  const handleSetPin = async () => {
    if (newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    try {
      await userService.setTransactionPin(newPin);
      toast.success("Transaction PIN set successfully!");
      setShowPinDialog(false);
      setNewPin("");
      onRefresh();
    } catch (e) {
      toast.error("Failed to set PIN");
    }
  };

  const toggleBio = async () => { if (!user) return; const newVal = !isBio; if (newVal) { try { toast.info("Preparing biometric registration..."); await biometricService.registerBiometrics(user.email); setIsBio(true); await userService.updateProfile(user.id, { isBiometricEnabled: true }); localStorage.setItem("viva_biometric_active", "true"); localStorage.setItem("viva_last_email", user.email); toast.success("Biometrics Registered Successfully"); onRefresh(); } catch (e: any) { toast.error(e.message || "Registration failed"); setIsBio(false); } } else { setIsBio(false); try { await userService.updateProfile(user.id, { isBiometricEnabled: false }); localStorage.removeItem("viva_biometric_active"); toast.success("Biometrics Disabled"); onRefresh(); } catch (e: any) { toast.error(e.message); } } };
  const toggle2FA = async () => { if (!user) return; const newVal = !is2FA; setIs2FA(newVal); try { await userService.updateProfile(user.id, { is2FAEnabled: newVal }); toast.success(`2FA ${newVal ? 'Enabled' : 'Disabled'}`); onRefresh(); } catch (e: any) { toast.error(e.message); } };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
            <Card className="rounded-3xl shadow-2xl overflow-hidden border-primary/20">
              <CardHeader className="bg-primary text-white">
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Security Hub</CardTitle>
                <CardDescription className="text-white/70">Protect your account and get help.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 text-foreground">
                <div className="divide-y">
                  <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Smartphone className="w-4 h-4" /></div>
                      <div><p className="text-sm font-bold">Biometric Login</p><p className="text-[10px] text-muted-foreground">Fingerprint/Face ID</p></div>
                    </div>
                    <input type="checkbox" checked={isBio} onChange={toggleBio} className="w-5 h-5 accent-primary cursor-pointer" />
                  </div>

                  <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Lock className="w-4 h-4" /></div>
                      <div><p className="text-sm font-bold">Two-Factor Auth</p><p className="text-[10px] text-muted-foreground">Extra layer of security</p></div>
                    </div>
                    <input type="checkbox" checked={is2FA} onChange={toggle2FA} className="w-5 h-5 accent-primary cursor-pointer" />
                  </div>

                  <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setShowPinDialog(true)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Lock className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm font-bold">{user?.transactionPin ? "Change Transaction PIN" : "Set Transaction PIN"}</p>
                        <p className="text-[10px] text-muted-foreground">Required for all transfers</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="p-4 bg-slate-50/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Help & Support</p>
                    <div className="space-y-2">
                      <a href="tel:08183793358" className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors"><Phone className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Call Support: 08183793358</span></a>
                      <a href="mailto:support@vivamobile.ng" className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors"><Mail className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Email Us</span></a>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4">
                <Button onClick={onClose} className="w-full rounded-xl">Got it</Button>
              </CardFooter>
            </Card>

            {/* In-place PIN Setting Dialog */}
            <AnimatePresence>
              {showPinDialog && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[300px]">
                    <Card className="rounded-[2rem]">
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">Set 4-Digit PIN</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <input
                          type="password"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••"
                          className="w-full text-center text-3xl font-black tracking-[1em] p-4 border-2 rounded-2xl bg-slate-50 outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1" onClick={() => setShowPinDialog(false)}>Cancel</Button>
                          <Button className="flex-1" onClick={handleSetPin}>Save</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function EditProfileModal({ user, isOpen, onClose, onRefresh }: any) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  useEffect(() => { setName(user?.name || ""); setPhone(user?.phoneNumber || ""); setAddress(user?.address || ""); setCapturedImage(user?.avatar || null); }, [user, isOpen]);
  const handleUpdate = async () => { if (!user) return; setIsSubmitting(true); try { await userService.updateProfile(user.id, { name, phoneNumber: phone, address, avatar: capturedImage }); toast.success("Profile updated!"); onRefresh(); onClose(); } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); } };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md my-8"><Card className="shadow-2xl border-primary/20"><CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-col items-center gap-4 py-2"><div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">{capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-muted-foreground opacity-30" />}</div><div className="flex gap-2"><div className="relative"><input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !user) return; try { const url = await storageService.uploadFile(`users/${user.id}/avatars/${Date.now()}`, file); setCapturedImage(url); toast.success("Photo uploaded!"); } catch (err) { toast.error("Upload failed"); } }} className="hidden" id="avatar-upload" /><label htmlFor="avatar-upload" className="flex items-center h-8 px-3 text-xs font-medium border rounded-md cursor-pointer hover:bg-slate-50 transition-colors"><Plus className="w-3 h-3 mr-2" /> Upload Photo</label></div></div></div><div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full p-4 border rounded-xl bg-background" /></div><div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-4 border rounded-xl bg-background" /></div><div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Home Address</label><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full address" className="w-full p-4 border rounded-xl bg-background min-h-[100px]" /></div><div className="flex gap-2 pt-4"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function SecurityAlertsModal({ isOpen, onClose, alerts }: any) {
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20"><CardHeader><CardTitle>Security Alerts</CardTitle></CardHeader><CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">{!alerts || alerts.length === 0 ? <p className="text-center py-10 opacity-50">No new alerts</p> : alerts.map((a: any) => (<div key={a.id} className="p-3 border rounded-xl"><p className="font-bold">{a.title}</p><p className="text-xs opacity-70">{a.message}</p></div>))}<Button className="w-full" onClick={onClose}>Close</Button></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function BillsModal({ isOpen, onClose, user, onRefresh, initialType = "Electricity" }: any) {
  const [billerType, setBillerType] = useState(initialType);
  const [biller, setBiller] = useState("");
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { setBillerType(initialType); setBiller(""); }, [initialType, isOpen]);
  const billers: any = { "Electricity": ["EKEDC", "IKEDC", "AEDC", "KEDCO"], "Internet": ["MTN Fiber", "Airtel Home", "Spectranet", "Smile"], "Cable TV": ["DSTV", "GOTV", "Startimes", "Showmax"] };
  const handlePay = async () => {
    if (!user || !amount || !biller || !customerId) { toast.error("Please fill in all details"); return; }
    if (!user.transactionPin) { toast.info("Please set your Transaction PIN in Security Hub first."); return; }

    // Using a simple prompt for now to keep code clean, or we could pass setPendingAction
    const pin = prompt("Enter your 4-digit Transaction PIN");
    if (!pin) return;

    setIsSubmitting(true);
    try {
      await billService.payBill(user.id, { biller: `${billerType}: ${biller}`, amount: parseFloat(amount), customerId, pin });
      toast.success(`${billerType} payment successful!`);
      onRefresh();
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); }
  };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20 rounded-3xl overflow-hidden"><CardHeader className="bg-slate-50 border-b"><CardTitle>Bill Payments</CardTitle><CardDescription>Pay your utility bills instantly.</CardDescription></CardHeader><CardContent className="space-y-4 pt-6"><div className="grid grid-cols-3 gap-2">{Object.keys(billers).map(type => (<button key={type} onClick={() => { setBillerType(type); setBiller(""); }} className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${billerType === type ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-slate-50'}`}>{type}</button>))}</div><select value={biller} onChange={e => setBiller(e.target.value)} className="w-full p-4 border rounded-xl bg-background text-sm"><option value="">Select Biller Provider</option>{billers[billerType].map((b: string) => <option key={b} value={b}>{b}</option>)}</select><input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="Customer ID / Smart Card Number" className="w-full p-4 border rounded-xl bg-background" /><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₦)" className="w-full p-4 border rounded-xl bg-background font-bold text-lg" /><div className="flex gap-2 pt-4"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={handlePay} disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Pay Bill Now"}</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function EscrowModal({ isOpen, onClose, user, onRefresh }: any) {
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCreate = async () => { if (!user || !amount || !receiver) return; setIsSubmitting(true); try { await escrowService.createEscrow(user.id, { amount: parseFloat(amount), receiver, sender: user.accountNumber }); toast.success("Escrow created successfully!"); onRefresh(); onClose(); } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); } };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20"><CardHeader><CardTitle>Escrow Service</CardTitle><CardDescription>Secure payments for goods and services.</CardDescription></CardHeader><CardContent className="space-y-4"><input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="Receiver Account/ID" className="w-full p-4 border rounded-xl bg-background" /><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₦)" className="w-full p-4 border rounded-xl bg-background" /><div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={handleCreate} disabled={isSubmitting}>Secure Now</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function UpgradeTierModal({ isOpen, onClose, user, onRefresh }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleUpgrade = async (tier: number) => { if (!user) return; setIsSubmitting(true); try { await userService.updateProfile(user.id, { tier }); toast.success(`Upgraded to Tier ${tier} successfully!`); if (onRefresh) onRefresh(); onClose(); } catch (e: any) { toast.error(e.message || "Upgrade failed"); } finally { setIsSubmitting(false); } };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden"><CardHeader className="bg-slate-50 border-b"><CardTitle className="text-xl font-black">Upgrade Account</CardTitle><CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Increase limits</CardDescription></CardHeader><CardContent className="space-y-4 pt-6"><button onClick={() => handleUpgrade(2)} disabled={isSubmitting || user?.tier >= 2} className={`w-full p-5 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${user?.tier >= 2 ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-primary/30 hover:bg-primary/5'}`}><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">2</div><div><p className="font-black text-sm">Tier 2 (Standard)</p><p className="text-[10px] font-bold text-muted-foreground uppercase">Limit: ₦1,000,000</p></div></div><ChevronRight className="w-5 h-5" /></button><button onClick={() => handleUpgrade(3)} disabled={isSubmitting || user?.tier >= 3} className={`w-full p-5 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${user?.tier >= 3 ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-primary/30 hover:bg-primary/5'}`}><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black">3</div><div><p className="font-black text-sm">Tier 3 (Ultimate)</p><p className="text-[10px] font-bold text-muted-foreground uppercase">Limit: ₦10,000,000</p></div></div><ChevronRight className="w-5 h-5" /></button></CardContent><CardFooter className="bg-slate-50 border-t pt-4"><Button variant="ghost" className="w-full font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Keep current</Button></CardFooter></Card></motion.div></div>)}</AnimatePresence>);
}

function AirtimeModal({ isOpen, onClose, user, onRefresh, initialMode = "Airtime" }: any) {
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [mode, setMode] = useState(initialMode);
  const [dataCategory, setDataCategory] = useState("Daily");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { setMode(initialMode); }, [initialMode, isOpen]);
  const networks = [ { name: "MTN", color: "bg-yellow-400 text-yellow-900" }, { name: "Airtel", color: "bg-red-600 text-white" }, { name: "Glo", color: "bg-sky-600 text-white" }, { name: "9mobile", color: "bg-sky-900 text-white" } ];
  const dataPlans: any = { "MTN": { "Daily": ["100MB - ₦100", "200MB - ₦200", "1GB - ₦300"], "Weekly": ["750MB - ₦500", "2GB - ₦1000"], "Monthly": ["1.5GB - ₦1000", "10GB - ₦2500"] }, "Airtel": { "Daily": ["100MB - ₦100", "1GB - ₦300"], "Weekly": ["1GB - ₦600", "6GB - ₦1500"], "Monthly": ["12GB - ₦3000"] }, "Glo": { "Daily": ["100MB - ₦100"], "Weekly": ["4GB - ₦1000"], "Monthly": ["25GB - ₦5000"] }, "9mobile": { "Daily": ["100MB - ₦100"], "Weekly": ["2GB - ₦1000"], "Monthly": ["15GB - ₦3000"] } };
  const handleBuy = async () => {
    if (!user || !amount) { toast.error("Please enter an amount"); return; }
    if (!user.transactionPin) { toast.info("Please set your Transaction PIN in Security Hub first."); return; }

    const pin = prompt("Enter your 4-digit Transaction PIN");
    if (!pin) return;

    const finalAmount = parseFloat(amount.toString().replace(/[^0-9]/g, ''));
    if (finalAmount > user.balance) { toast.error("Insufficient balance"); return; }
    setIsSubmitting(true);
    try {
      await rechargeService.recharge(user.id, { phoneNumber: phone, amount: finalAmount, type: mode.toLowerCase(), network, pin });
      toast.success(`${network} ${mode} Successful!`);
      onRefresh();
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); }
  };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20 rounded-3xl overflow-hidden"><CardHeader className="bg-slate-50 border-b"><div className="flex justify-between items-center"><div><CardTitle>{mode} Top-up</CardTitle></div><div className="flex bg-slate-200 p-1 rounded-lg"><button onClick={() => setMode("Airtime")} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === "Airtime" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Airtime</button><button onClick={() => setMode("Data")} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === "Data" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Data</button></div></div></CardHeader><CardContent className="space-y-6 pt-6"><div className="grid grid-cols-4 gap-2">{networks.map(n => (<button key={n.name} onClick={() => { setNetwork(n.name); }} className={`flex flex-col items-center gap-2 p-2 rounded-xl border ${network === n.name ? 'border-primary bg-primary/5' : 'border-transparent'}`}><div className={`w-10 h-10 rounded-full ${n.color} flex items-center justify-center font-black text-[10px]`}>{n.name}</div><span className="text-[10px] font-bold">{n.name}</span></button>))}</div><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08012345678" className="w-full p-4 border rounded-xl bg-background font-medium" />{mode === "Airtime" ? (<input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-4 border rounded-xl bg-background font-black text-2xl" />) : (<div className="space-y-4"><div className="flex gap-2 justify-center">{["Daily", "Weekly", "Monthly"].map(cat => (<button key={cat} onClick={() => { setDataCategory(cat); setAmount(""); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${dataCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{cat}</button>))}</div><div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2">{dataPlans[network][dataCategory].map((plan: string) => (<button key={plan} onClick={() => setAmount(plan.split('₦')[1])} className={`p-4 rounded-xl border text-left flex justify-between items-center font-bold text-sm ${amount === plan.split('₦')[1] ? "border-primary bg-primary/5" : "bg-white shadow-sm"}`}>{plan.split(' - ')[0]}<span className="text-primary">₦{plan.split('₦')[1]}</span></button>))}</div></div>)}<div className="flex gap-2 pt-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleBuy} disabled={isSubmitting}>{isSubmitting ? "..." : `Pay ₦${amount || '0'}`}</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function InvestModal({ isOpen, onClose, user, onRefresh }: any) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Fixed Deposit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleInvest = async () => { if (!user || !amount) return; setIsSubmitting(true); try { await investmentService.invest(user.id, { amount: parseFloat(amount), type, sender: user.accountNumber }); toast.success(`₦${amount} Invested!`); onRefresh(); onClose(); } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); } };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20"><CardHeader><CardTitle>Invest</CardTitle></CardHeader><CardContent className="space-y-4"><select value={type} onChange={e => setType(e.target.value)} className="w-full p-4 border rounded-xl bg-background"><option value="Fixed Deposit">Fixed Deposit (12% p.a)</option><option value="Mutual Funds">Mutual Funds (9% p.a)</option></select><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₦0.00" className="w-full p-4 border rounded-xl bg-background font-black text-2xl" /><div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={handleInvest} disabled={isSubmitting}>Invest Now</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function BetModal({ isOpen, onClose, user, onRefresh }: any) {
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleTopup = async () => { if (!user || !amount || !platform || !customerId) return; setIsSubmitting(true); try { await bettingService.topup(user.id, { platform, amount: parseFloat(amount), customerId, sender: user.accountNumber }); toast.success("Topup successful!"); onRefresh(); onClose(); } catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); } };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20"><CardHeader><CardTitle>Betting</CardTitle></CardHeader><CardContent className="space-y-4"><select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full p-4 border rounded-xl bg-background"><option value="">Select Platform</option><option value="SportyBet">SportyBet</option><option value="Bet9ja">Bet9ja</option></select><input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="User ID" className="w-full p-4 border rounded-xl bg-background" /><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₦0.00" className="w-full p-4 border rounded-xl bg-background font-black text-2xl" /><div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={handleTopup} disabled={isSubmitting}>Topup</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function ScanModal({ isOpen, onClose, user, onRefresh }: any) {
  const [isScanning, setIsScanning] = useState(true);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const handlePay = async () => { if (!user || !amount) return; setIsProcessing(true); try { await scanPayService.pay(user.id, { merchantId: "VIVA-MERCH-819", amount: parseFloat(amount), sender: user.accountNumber }); toast.success("Paid!"); onRefresh(); onClose(); } catch (e: any) { toast.error(e.message); } finally { setIsProcessing(false); } };
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm"><Card className="shadow-2xl rounded-3xl"><CardHeader className="text-center"><CardTitle>Scan</CardTitle></CardHeader><CardContent className="space-y-6 text-center">{isScanning ? (<div className="space-y-4"><div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/30"><Camera className="w-12 h-12 text-muted-foreground opacity-20" /></div><Button className="w-full" onClick={() => setIsScanning(false)}>Scan QR</Button></div>) : (<div className="space-y-4 animate-in fade-in zoom-in-95"><h3 className="text-xl font-black">Viva Merchant</h3><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 border rounded-xl text-center text-2xl font-bold bg-background" /><Button className="w-full h-12" onClick={handlePay} disabled={isProcessing}>Pay</Button></div>)}<Button variant="ghost" className="w-full" onClick={onClose}>Close</Button></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function FundModal({ isOpen, onClose, user, onRefresh }: any) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const handleFund = async () => {
    if (!user || !amount) { toast.error("Enter amount"); return; }
    setIsSubmitting(true);
    if (method === 'card') {
      try { await paystackService.initializeTransaction(user.email, parseFloat(amount), async () => { await transactionService.addTransaction(user.id, { amount: parseFloat(amount), type: 'deposit', sender: 'Card', receiver: user.accountNumber, status: 'success' }); await userService.updateBalance(user.id, parseFloat(amount)); toast.success("Funded!"); onRefresh(); onClose(); setIsSubmitting(false); }); }
      catch (e: any) { toast.error("Failed"); setIsSubmitting(false); }
      return;
    }
    try { await transactionService.addTransaction(user.id, { amount: parseFloat(amount), type: 'deposit', sender: 'Transfer', receiver: user.accountNumber, status: 'success' }); await userService.updateBalance(user.id, parseFloat(amount)); toast.success("Funded!"); onRefresh(); onClose(); }
    catch (e: any) { toast.error(e.message); } finally { setIsSubmitting(false); }
  };

  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md"><Card className="shadow-2xl border-primary/20 rounded-3xl overflow-hidden"><CardHeader className="bg-slate-50 border-b"><CardTitle>Fund Wallet</CardTitle></CardHeader><CardContent className="space-y-6 pt-6"><Tabs defaultValue="transfer" onValueChange={setMethod}><TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-xl"><TabsTrigger value="transfer" className="rounded-lg font-bold">Transfer</TabsTrigger><TabsTrigger value="card" className="rounded-lg font-bold">Card</TabsTrigger></TabsList><TabsContent value="transfer" className="space-y-4 pt-4"><div className="p-6 bg-sky-50 rounded-2xl border-2 border-dashed border-primary/20 text-center"><p className="text-[10px] text-sky-800 uppercase font-black tracking-widest mb-2">Virtual Account</p><p className="text-3xl font-black text-sky-800 tracking-tighter">{user?.accountNumber}</p><p className="text-[10px] text-muted-foreground mt-3 font-bold">Bank: {user?.providerBank || "VIVA BANK"}</p><p className="text-[9px] text-muted-foreground mt-1">Transfer to this account from any bank app to fund your wallet instantly.</p><button onClick={() => { navigator.clipboard.writeText(user?.accountNumber || ""); toast.success("Copied!"); }} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-sky-500 text-white rounded-full text-xs font-bold">Copy Number</button></div></TabsContent>
                    <TabsContent value="card" className="space-y-4 pt-4"><div className="bg-slate-900 p-6 rounded-2xl text-white space-y-4"><input value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} placeholder="0000 0000 0000 0000" className="w-full bg-transparent border-none text-xl font-mono outline-none" /><div className="flex gap-4"><input value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} placeholder="MM/YY" className="w-16 bg-transparent border-none text-xs outline-none" /><input value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} placeholder="CVV" className="w-12 bg-transparent border-none text-xs outline-none" /></div></div></TabsContent></Tabs><div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl">₦</span><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-6 pl-10 border-2 rounded-2xl bg-background font-black text-3xl outline-none" /></div></div><div className="flex gap-3"><Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>Cancel</Button><Button className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" onClick={handleFund} disabled={isSubmitting}>{isSubmitting ? "..." : "Fund Now"}</Button></div></CardContent></Card></motion.div></div>)}</AnimatePresence>);
}

function MoreModal({ isOpen, onClose, setters }: any) {
  const services = [ { icon: <Globe />, label: "Data", onClick: () => { setters.setAirtimeMode("Data"); setters.setIsAirtimeOpen(true); onClose(); } }, { icon: <Tv />, label: "Cable TV", onClick: () => { setters.setBillsType("Cable TV"); setters.setIsBillsOpen(true); onClose(); } }, { icon: <Zap />, label: "Power", onClick: () => { setters.setBillsType("Electricity"); setters.setIsBillsOpen(true); onClose(); } }, { icon: <Gamepad2 />, label: "Betting", onClick: () => { setters.setIsBetOpen(true); onClose(); } }, { icon: <Hash />, label: "USSD", onClick: () => { setters.setIsUSSDOpen(true); onClose(); } }, { icon: <ShieldCheck />, label: "Security", onClick: () => { setters.setIsSecurityModalOpen(true); onClose(); } }, { icon: <Wallet />, label: "Fund", onClick: () => { setters.setIsFundOpen(true); onClose(); } }, { icon: <Info />, label: "Help", onClick: () => { window.location.href="tel:08183793358"; } }, ];
  return (<AnimatePresence>{isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm"><Card className="rounded-3xl shadow-2xl overflow-hidden border-primary/20"><CardHeader className="bg-slate-50 border-b"><CardTitle>All Services</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-6 p-8">{services.map((s, i) => (<button key={i} onClick={s.onClick} className="flex flex-col items-center gap-2 group outline-none"><div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 text-foreground group-active:scale-90">{s.icon}</div><span className="text-[10px] font-bold text-foreground text-center">{s.label}</span></button>))}</CardContent><CardFooter className="bg-slate-50 border-t pt-4 pb-4"><Button variant="ghost" className="w-full font-bold" onClick={onClose}>Close</Button></CardFooter></Card></motion.div></div>)}</AnimatePresence>);
}

function KYCView({ user, onRefresh }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bvn, setBvn] = useState(user?.bvn || "");
  const [nin, setNin] = useState(user?.nin || "");
  const [utilityBill, setUtilityBill] = useState(user?.utilityBill || "");
  const [businessCert, setBusinessCert] = useState<string | null>(null);
  const [tier, setTier] = useState(user?.tier || 1);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File, type: string) => {
    if (!user) return;
    try {
      const url = await storageService.uploadFile(`business/${user.id}/${type}_${Date.now()}`, file);
      if (type === 'cert') setBusinessCert(url);
      toast.success(`${type} uploaded successfully`);
    } catch (e) {
      toast.error("File upload failed");
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      if (tier === 1) {
        await paystackService.verifyIdentity('bvn', bvn);
        await userService.updateProfile(user.id, { isVerified: true, tier: 2, bvn, nin });
        setIsSuccess(true);
        toast.success("Identity Verified! Level 2 reached.");
      } else {
        await userService.updateProfile(user.id, { tier: 3, utilityBill, businessCert });
        setIsSuccess(true);
        toast.success("Business Fully Verified! Level 3 reached.");
      }
      if (onRefresh) onRefresh();
      setTimeout(() => navigate("/profile"), 2000);
    } catch (e: any) {
      toast.error("Verification Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 py-4 px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-black">Business Verification</h2>
      </div>
      <Card className="border-none shadow-xl bg-slate-50 p-6 rounded-[2rem] text-foreground">
        <div className="space-y-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {tier === 1 ? "Step 1: Director Identity" : "Step 2: Business Registration"}
          </p>

          {tier === 1 ? (
            <div className="space-y-4">
              <input value={bvn} onChange={e => setBvn(e.target.value)} placeholder="Director BVN" className="w-full p-4 border-2 rounded-2xl" />
              <input value={nin} onChange={e => setNin(e.target.value)} placeholder="Director NIN" className="w-full p-4 border-2 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-4">
              <input value={utilityBill} onChange={e => setUtilityBill(e.target.value)} placeholder="Business Address Utility Bill" className="w-full p-4 border-2 rounded-2xl" />
              <div className="p-4 border-2 border-dashed rounded-2xl bg-white text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Upload CAC Certificate / Incorporation Docs</p>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cert')}
                  className="text-xs"
                />
                {businessCert && <p className="text-sky-600 text-[10px] font-bold mt-2">Document Attached ✓</p>}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {[1,2,3].map(t => (
              <div key={t} className={`flex gap-4 items-center p-3 bg-white rounded-2xl border-2 ${user?.tier >= t ? 'border-sky-500' : 'border-slate-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${user?.tier >= t ? 'bg-sky-500 text-white' : 'bg-slate-200'}`}>{t}</div>
                <div><p className="font-black text-xs">Level {t} {t === 3 ? '(Corporate)' : ''}</p></div>
                {user?.tier >= t && <CheckCircle2 className="w-4 h-4 text-sky-500 ml-auto" />}
              </div>
            ))}
          </div>

          {isSuccess ? (
            <div className="p-4 bg-sky-500 text-white rounded-2xl text-center font-black animate-bounce">Verification Submitted!</div>
          ) : (
            <Button className="w-full h-16 rounded-[1.5rem] font-black mt-4 shadow-xl" onClick={handleVerify} disabled={isProcessing || tier >= 3}>
              {isProcessing ? "Processing Docs..." : `Upgrade to Level ${tier + 1}`}
            </Button>
          )}
        </div>
      </Card>
      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <p className="text-[10px] text-blue-800 font-medium">Business accounts require Level 3 verification to access higher transfer limits and corporate tax features.</p>
        </div>
      </div>
    </div>
  );
}

function AccountSettings({ user, onRefresh }: any) {
  const [is2FA, setIs2FA] = useState(false);
  const [isBio, setIsBio] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { if (user) { setIs2FA(user.is2FAEnabled ?? false); setIsBio(user.isBiometricEnabled ?? false); setNotifications(localStorage.getItem("viva_notifications") !== "false"); setPrivacy(localStorage.getItem("viva_privacy_mode") === "true"); } }, [user]);
  const saveSettings = async () => { if (!user) return; setIsSaving(true); try { await userService.updateProfile(user.id, { is2FAEnabled: is2FA, isBiometricEnabled: isBio }); localStorage.setItem("viva_notifications", notifications.toString()); localStorage.setItem("viva_privacy_mode", privacy.toString()); toast.success("Saved!"); if (onRefresh) onRefresh(); } catch (e: any) { toast.error("Failed to save"); } finally { setIsSaving(false); } };
  const Toggle = ({ checked, onChange, color }: any) => ( <div onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${checked ? color || 'bg-sky-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${checked ? 'left-7' : 'left-1'}`} /></div> );
  return (<div className="max-w-md mx-auto py-6 space-y-6 px-4"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full bg-slate-100"><ChevronLeft className="w-5 h-5" /></Button><h2 className="text-xl font-black">Settings</h2></div><Card className="rounded-[2rem] border-none shadow-2xl bg-white"><CardContent className="p-2"><div className="space-y-1"><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><Smartphone className="w-5 h-5 text-sky-600" /><div><p className="text-sm font-black">Biometrics</p></div></div><Toggle checked={isBio} onChange={setIsBio} /></div><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><Lock className="w-5 h-5 text-sky-600" /><div><p className="text-sm font-black">Two-Factor</p></div></div><Toggle checked={is2FA} onChange={setIs2FA} color="bg-sky-600" /></div><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><Bell className="w-5 h-5 text-orange-600" /><div><p className="text-sm font-black">Notifications</p></div></div><Toggle checked={notifications} onChange={setNotifications} color="bg-orange-500" /></div><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-4"><ShieldCheck className="w-5 h-5 text-purple-600" /><div><p className="text-sm font-black">Privacy</p></div></div><Toggle checked={privacy} onChange={setPrivacy} color="bg-purple-600" /></div></div></CardContent></Card><Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" onClick={saveSettings} disabled={isSaving}>{isSaving ? "Saving..." : "Save Preferences"}</Button></div>);
}

function CardsView({ user, onRefresh }: any) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const data = await cardService.getCards();
      setCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (cardId: string) => {
    setIsRevealing(true);
    try {
      const details = await cardService.getCardDetails(cardId);
      setCardDetails(details);
    } catch (e) {
      toast.error("Failed to reveal card details");
    } finally {
      setIsRevealing(false);
    }
  };

  const toggleFreeze = async (card: any) => {
    const newStatus = card.status === 'active' ? 'frozen' : 'active';
    try {
      await cardService.updateCardStatus(card.id, newStatus);
      toast.success(`Card ${newStatus === 'active' ? 'unfrozen' : 'frozen'} successfully`);
      fetchCards();
    } catch (e) {
      toast.error("Failed to update card status");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-black">Virtual Cards</h2>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="rounded-xl h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> New Card
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 opacity-50 font-bold uppercase tracking-widest text-[10px]">Loading Cards...</div>
      ) : cards.length === 0 ? (
        <div className="text-center space-y-6 py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CreditCard className="w-10 h-10 text-primary opacity-20" />
          </div>
          <div>
            <p className="font-black text-slate-900">No Virtual Cards</p>
            <p className="text-xs text-muted-foreground mt-1">Create a card to start making secure online payments.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl px-8">Create Your First Card</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layoutId={card.id}
              onClick={() => { setSelectedCard(card); setCardDetails(null); }}
              className={`relative h-56 w-full ${card.color} rounded-[2rem] p-8 text-white shadow-2xl cursor-pointer overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-colors" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{card.type}</p>
                    <h3 className="text-lg font-black mt-1">Viva Business</h3>
                  </div>
                  <div className="w-12 h-8 bg-white/20 rounded-md backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Wifi className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl font-mono tracking-[0.2em] font-bold">
                    •••• •••• •••• {card.last4}
                  </p>
                  <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest opacity-70">
                    <div>
                      <p>Expiry</p>
                      <p className="text-sm font-mono mt-0.5">{card.expiry}</p>
                    </div>
                    <div>
                      <p>CVV</p>
                      <p className="text-sm font-mono mt-0.5">•••</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <p className="font-black uppercase tracking-tight text-sm">{card.name}</p>
                  <div className="flex gap-2">
                    {card.status === 'frozen' && <Badge className="bg-red-500/20 text-red-100 border-none text-[8px] font-black uppercase">Frozen</Badge>}
                    <div className="w-10 h-6 bg-orange-400 rounded-sm opacity-80" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Card Detail Sheet */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black">{selectedCard.type}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Managed Virtual Card</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCard(null)} className="rounded-full bg-slate-100">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className={`w-full aspect-video ${selectedCard.color} rounded-3xl p-6 text-white relative overflow-hidden shadow-xl`}>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Viva Business</p>
                    <div className="space-y-4">
                      <p className="text-2xl font-mono tracking-widest font-bold">
                        {cardDetails ? cardDetails.pan.replace(/(.{4})/g, '$1 ') : `•••• •••• •••• ${selectedCard.last4}`}
                      </p>
                      <div className="flex gap-10">
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-60">Expiry</p>
                          <p className="text-sm font-mono font-bold">{selectedCard.expiry}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-60">CVV</p>
                          <p className="text-sm font-mono font-bold">{cardDetails ? cardDetails.cvv : '•••'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="h-14 rounded-2xl font-black"
                    onClick={() => handleReveal(selectedCard.id)}
                    disabled={isRevealing || !!cardDetails}
                  >
                    {isRevealing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    {cardDetails ? "Details Visible" : "Show Details"}
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-14 rounded-2xl font-black ${selectedCard.status === 'active' ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-sky-600 border-sky-100 hover:bg-sky-50'}`}
                    onClick={() => toggleFreeze(selectedCard)}
                  >
                    {selectedCard.status === 'active' ? <Lock className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    {selectedCard.status === 'active' ? "Freeze Card" : "Unfreeze"}
                  </Button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Controls</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border text-slate-600"><Settings className="w-4 h-4" /></div>
                      <span className="text-sm font-bold">Transaction Limit</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateCardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => { fetchCards(); onRefresh(); }} />
    </div>
  );
}

function CreateCardModal({ isOpen, onClose, onCreated }: any) {
  const [type, setType] = useState("Corporate Mastercard");
  const [color, setColor] = useState("bg-slate-900");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { id: "bg-slate-900", label: "Midnight" },
    { id: "bg-gradient-to-br from-purple-600 to-blue-600", label: "Deep Sea" },
    { id: "bg-gradient-to-br from-emerald-500 to-teal-700", label: "Emerald" },
    { id: "bg-gradient-to-br from-orange-500 to-red-600", label: "Lava" },
  ];

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await cardService.createCard({ type, color });
      toast.success("Card created successfully!");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to create card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-xl font-black">New Virtual Card</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Issuance Fee: ₦1,000</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className={`h-48 w-full ${color} rounded-3xl p-6 text-white shadow-xl transition-all duration-500 flex flex-col justify-between`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Viva Business</p>
                  <p className="text-xl font-mono tracking-widest font-bold">•••• •••• •••• ••••</p>
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-black uppercase">YOUR NAME</p>
                    <div className="w-10 h-6 bg-white/20 rounded-sm" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Card Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary transition-colors font-bold">
                      <option>Corporate Mastercard</option>
                      <option>Virtual Visa Card</option>
                      <option>USD Corporate Card</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Choose Design</label>
                    <div className="flex gap-3">
                      {colors.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setColor(c.id)}
                          className={`w-10 h-10 rounded-full ${c.id} border-2 ${color === c.id ? 'border-primary' : 'border-white'} shadow-sm transition-transform active:scale-90`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting ? "Issuing..." : "Pay ₦1,000"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AdminDashboard({ user }: any) {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsData = await adminService.getStats();
        const usersData = await adminService.getUsers();
        setStats(statsData);
        setUsers(usersData);
      } catch (err) {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-slate-100"><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-2xl font-black">Admin Command Center</h2>
        </div>
        <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-2">LIVE MONITORING</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-none shadow-sm bg-blue-50">
          <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Total Users</p>
          <h3 className="text-3xl font-black">{stats?.totalUsers || 0}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-purple-50">
          <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Total Tx</p>
          <h3 className="text-3xl font-black">{stats?.totalTransactions || 0}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-orange-50">
          <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Volume</p>
          <h3 className="text-3xl font-black">₦{(stats?.totalVolume || 0).toLocaleString()}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-emerald-50">
          <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Security Score</p>
          <h3 className="text-3xl font-black">98%</h3>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-4">
          <TabsTrigger value="activity" className="rounded-lg font-bold px-6">Live Activity</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-bold px-6">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="border shadow-sm rounded-3xl overflow-hidden">
            <CardHeader><CardTitle className="text-lg">Recent System Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {stats?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {act.type === 'LOGIN' ? <Lock className="w-5 h-5" /> : act.type === 'TRANSFER_INITIATED' ? <Send className="w-5 h-5" /> : <ActivityIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-black">{act.detail}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{act.user?.name} • {new Date(act.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black">{act.ip}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Balance</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Risk</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            {u.avatar && <img src={u.avatar} className="w-full h-full object-cover" />}
                          </div>
                          <div><p className="text-sm font-bold">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="p-4 font-black text-sm">₦{(u.balance || 0).toLocaleString()}</td>
                      <td className="p-4"><Badge variant={u.riskLevel === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{u.riskLevel}</Badge></td>
                      <td className="p-4"><Badge className="bg-sky-500 text-[10px]">Tier {u.tier}</Badge></td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger><Button variant="ghost" size="sm" className="font-bold">Manage</Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => adminService.promoteToAdmin(u.id).then(() => toast.success("Promoted!"))}>Make Admin</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => adminService.updateRiskLevel(u.id, 'high').then(() => toast.success("Risk Updated!"))}>Mark High Risk</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Freeze Account</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AIInsightsSection({ userId }: { userId: string | undefined }) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchInsights = async () => {
      try {
        const { apiRequest } = await import("./lib/api");
        const data = await apiRequest("/api/finance/ai-insights");
        setInsights(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [userId]);

  if (loading) return (
    <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed">
      <RefreshCcw className="w-6 h-6 mx-auto animate-spin text-primary opacity-20" />
      <p className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-40">AI Analyzing Business Data...</p>
    </div>
  );

  return (
    <Card className="bg-slate-900 text-white border-none overflow-hidden rounded-[2.5rem] shadow-2xl relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

      <CardHeader className="flex flex-row items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary backdrop-blur-md border border-white/10 shadow-xl">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <CardTitle className="text-xl font-black">AI Business Advisor</CardTitle>
          <CardDescription className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Growth & Tax Optimization</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10 pt-4">
        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Cash Flow Insight</span>
          </div>
          <p className="text-sm font-medium text-white/90 leading-relaxed">{insights?.cashFlowInsight}</p>
        </div>

        <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-2 hover:bg-emerald-500/20 transition-colors">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Tax Optimization Tip</span>
          </div>
          <p className="text-sm font-medium text-emerald-50/90 leading-relaxed">{insights?.taxTip}</p>
        </div>

        <div className="p-5 bg-sky-500/10 rounded-2xl border border-sky-500/20 space-y-2 hover:bg-sky-500/20 transition-colors">
          <div className="flex items-center gap-2 text-sky-400">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Strategic Growth</span>
          </div>
          <p className="text-sm font-medium text-sky-50/90 leading-relaxed">{insights?.growthRecommendation}</p>
        </div>
      </CardContent>

      <CardFooter className="bg-white/5 border-t border-white/5 pt-4">
        <Button variant="ghost" className="w-full text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest">
          View Detailed Audit
        </Button>
      </CardFooter>
    </Card>
  );
}

export default App;
