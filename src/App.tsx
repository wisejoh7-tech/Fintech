import React, { useState, useEffect, useMemo } from "react";
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Send,
  QrCode,
  TrendingUp,
  User as UserIcon,
  ShieldAlert
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { auth } from "./lib/firebase";
import { Capacitor } from '@capacitor/core';
import { onAuthStateChanged } from "firebase/auth";

import {
  userService,
  transactionService,
  beneficiaryService,
  rewardService,
} from "./lib/services";
import { getSocket } from "./lib/socket";

// Types
import { User, Transaction } from "./lib/types";

// Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import HistoryView from "./pages/History";
import KYCView from "./pages/KYCView";
import AdminDashboard from "./pages/Admin";
import AccountSettings from "./pages/Settings";
import RewardsHub from "./pages/Rewards";
import LoginScreen from "./pages/Login";
import RegisterScreen from "./pages/Register";
import CardsView from "./pages/CardsView";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Components
import MainNavbar from "./components/layout/MainNavbar";

// Modals
import USSDModal from "./components/modals/USSDModal";
import SecurityCenterModal from "./components/modals/SecurityCenterModal";
import EditProfileModal from "./components/modals/EditProfileModal";
import SecurityAlertsModal from "./components/modals/SecurityAlertsModal";
import BillsModal from "./components/modals/BillsModal";
import EscrowModal from "./components/modals/EscrowModal";
import UpgradeTierModal from "./components/modals/UpgradeTierModal";
import AirtimeModal from "./components/modals/AirtimeModal";
import InvestModal from "./components/modals/InvestModal";
import BetModal from "./components/modals/BetModal";
import ScanModal from "./components/modals/ScanModal";
import FundModal from "./components/modals/FundModal";
import WithdrawModal from "./components/modals/WithdrawModal";
import ScheduledPaymentsModal from "./components/modals/ScheduledPaymentsModal";
import VaultsModal from "./components/modals/VaultsModal";
import InvoicesModal from "./components/modals/InvoicesModal";
import StaffModal from "./components/modals/StaffModal";
import ApprovalsModal from "./components/modals/ApprovalsModal";
import BulkTransferModal from "./components/modals/BulkTransferModal";
import PaymentLinksModal from "./components/modals/PaymentLinksModal";
import TransactionReceiptModal from "./components/modals/TransactionReceiptModal";
import PinInputModal from "./components/modals/PinInputModal";
import MoreModal from "./components/modals/MoreModal";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);

  // Modal Visibility State
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [billsType, setBillsType] = useState("Electricity");
  const [isEscrowOpen, setIsEscrowOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isAirtimeOpen, setIsAirtimeOpen] = useState(false);
  const [airtimeMode, setAirtimeMode] = useState("Airtime");
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isBetOpen, setIsBetOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isUSSDOpen, setIsUSSDOpen] = useState(false);
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

        const fetchUserData = async () => {
          try {
            const data = await apiRequest("/api/user");
            setUser(data);
            setIsAuthenticated(true);
            setLoading(false);
          } catch (err) {
            console.error("Backend fetch failed:", err);
            unsubscribeUser = userService.subscribeToUser(firebaseUser.uid, (userData) => {
               if (userData) {
                 setUser(userData as any);
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

        const socket = getSocket();
        socket.emit("join", firebaseUser.uid);
        socket.on("notification", (data: { title: string, body: string }) => {
          toast.info(data.title, {
            description: data.body,
          });
          fetchData();
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
      rewardService.getBalance().then(data => setRewardBalance(data.balance)).catch(err => {
        console.error("Reward balance fetch failed:", err);
      });

      const fetchAccounts = async () => {
        try {
          const { apiRequest } = await import("./lib/api");
          const data = await apiRequest("/api/accounts");
          if (Array.isArray(data) && data.length > 0) {
            setAccounts(data);
          } else {
            setAccounts([{
              id: 'default',
              currency: 'NGN',
              balance: user?.balance || 0,
              accountNumber: user?.accountNumber || '---'
            }]);
          }
        } catch (e) {
          console.error("Accounts fetch failed:", e);
          setAccounts([{
            id: 'default',
            currency: 'NGN',
            balance: user?.balance || 0,
            accountNumber: user?.accountNumber || '---'
          }]);
        }
      };
      fetchAccounts();
    }
  }, [isAuthenticated, user?.balance, user?.accountNumber]);

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
            <MainNavbar
              user={user}
              securityAlerts={securityAlerts}
              setIsAlertsOpen={setIsAlertsOpen}
              setIsSecurityModalOpen={setIsSecurityModalOpen}
              setIsEditProfileOpen={setIsEditProfileOpen}
            />

            <main className="container mx-auto px-4 py-8 max-w-7xl pb-24 md:pb-8">
              {!navigator.onLine && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
                  <ShieldAlert className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold uppercase">Connection Issue</p>
                    <p className="text-[10px] opacity-80">You are currently offline. Some features may not be available.</p>
                  </div>
                </div>
              )}
              <Routes>
                <Route path="/" element={
                  <Dashboard
                    user={user}
                    transactions={transactions}
                    onRefresh={fetchData}
                    setIsBillsOpen={setIsBillsOpen}
                    setIsAirtimeOpen={setIsAirtimeOpen}
                    setIsInvestOpen={setIsInvestOpen}
                    setIsSecurityModalOpen={setIsSecurityModalOpen}
                    setIsEditProfileOpen={setIsEditProfileOpen}
                    setIsBetOpen={setIsBetOpen}
                    setIsScanOpen={setIsScanOpen}
                    setIsUSSDOpen={setIsUSSDOpen}
                    setIsMoreOpen={setIsMoreOpen}
                    setIsFundOpen={setIsFundOpen}
                    setIsWithdrawOpen={setIsWithdrawOpen}
                    accounts={accounts}
                    activeAccountIndex={activeAccountIndex}
                    setActiveAccountIndex={setActiveAccountIndex}
                    setIsPinOpen={setIsPinOpen}
                    setPendingAction={setPendingAction}
                    beneficiaries={beneficiaries}
                    setIsVaultsOpen={setIsVaultsOpen}
                    setIsScheduledOpen={setIsScheduledOpen}
                    setIsInvoicesOpen={setIsInvoicesOpen}
                    setIsStaffOpen={setIsStaffOpen}
                    setIsApprovalsOpen={setIsApprovalsOpen}
                    setIsBulkOpen={setIsBulkOpen}
                    setIsPaymentLinksOpen={setIsPaymentLinksOpen}
                    setSelectedTransaction={setSelectedTransaction}
                    setIsReceiptOpen={setIsReceiptOpen}
                  />
                } />
                <Route path="/history" element={<HistoryView user={user} transactions={transactions} />} />
                <Route path="/profile" element={
                  <Profile
                    user={user}
                    setIsUpgradeOpen={setIsUpgradeOpen}
                    setIsSecurityModalOpen={setIsSecurityModalOpen}
                    setIsEditProfileOpen={setIsEditProfileOpen}
                  />
                } />
                <Route path="/settings" element={<AccountSettings user={user} onRefresh={fetchData} />} />
                <Route path="/cards" element={<CardsView user={user} onRefresh={fetchData} />} />
                <Route path="/admin" element={<AdminDashboard user={user} />} />
                <Route path="/kyc" element={<KYCView user={user} onRefresh={fetchData} />} />
                <Route path="/rewards" element={<RewardsHub balance={rewardBalance} onRefresh={() => rewardService.getBalance().then(data => setRewardBalance(data.balance))} />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
              </Routes>
            </main>

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
        <ScheduledPaymentsModal isOpen={isScheduledOpen} onClose={() => setIsScheduledOpen(false)} />
        <VaultsModal isOpen={isVaultsOpen} onClose={() => setIsVaultsOpen(false)} onRefresh={fetchData} />
        <InvoicesModal isOpen={isInvoicesOpen} onClose={() => setIsInvoicesOpen(false)} />
        <StaffModal isOpen={isStaffOpen} onClose={() => setIsStaffOpen(false)} />
        <ApprovalsModal isOpen={isApprovalsOpen} onClose={() => setIsApprovalsOpen(false)} onRefresh={fetchData} />
        <BulkTransferModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} onRefresh={fetchData} />
        <PaymentLinksModal isOpen={isPaymentLinksOpen} onClose={() => setIsPaymentLinksOpen(false)} />
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
