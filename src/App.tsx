import React, { useState, useEffect, useRef, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ShieldCheck, 
  CreditCard, 
  Send, 
  Plus, 
  Bell, 
  User as UserIcon,
  Search,
  TrendingUp,
  LayoutDashboard,
  X,
  CheckCircle2,
  AlertCircle,
  Settings,
  LogOut,
  ChevronRight,
  Lock,
  Smartphone,
  Globe,
  Gamepad2,
  Building2,
  QrCode,
  Fingerprint,
  ArrowDown,
  ArrowDownCircle,
  Check,
  Copy,
  LayoutGrid,
  ShieldAlert,
  Calendar,
  ReceiptText,
  Users,
  UserCog,
  UserPlus,
  Activity as ActivityIcon,
  Phone,
  Mail,
  Share2,
  RefreshCcw,
  Download,
  ExternalLink,
  MapPin,
  Monitor,
  ShieldCheck as ShieldCheckIcon,
  Info,
  Eye,
  EyeOff,
  Wifi,
  Home,
  Cpu,
  Store,
  Tv,
  Layout,
  Zap,
  Plane,
  School,
  Ticket,
  ShoppingBag,
  Sun,
  Moon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { QRCodeSVG } from "qrcode.react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { 
  userService, 
  transactionService, 
  alertService, 
  cardService, 
  activityService,
  recurringPaymentService,
  escrowService,
  billService,
  rechargeService,
  bettingService,
  investmentService,
  scanPayService,
  adminService
} from "./lib/services";

// --- Constants ---
export const TIER_LIMITS = {
  1: { unverified: 50000, verified: 100000, label: "Basic", requirements: "Email & Phone Verification" },
  2: { unverified: 500000, verified: 1000000, label: "Standard", requirements: "BVN Verification" },
  3: { unverified: 2000000, verified: 10000000, label: "Ultimate", requirements: "Address Verification & High Volume" }
};

export const getEffectiveLimit = (tier: number, isVerified: boolean) => {
  const t = (TIER_LIMITS as any)[tier] || TIER_LIMITS[1];
  return isVerified ? t.verified : t.unverified;
};

// --- Types ---
interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  type: string;
  date: string;
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
  bvn: string;
  role: 'user' | 'admin';
  transferLimit?: number;
  tier: number;
  canPayBills: boolean;
  isBiometricEnabled: boolean;
  avatar?: string;
}

interface ExternalCard {
  id: string;
  bank: string;
  type: string;
  last4: string;
  expiry: string;
  color: string;
}

interface Activity {
  id: string;
  type: string;
  detail: string;
  date: string;
}

interface CardData {
  id: string;
  type: string;
  number: string;
  name: string;
  expiry: string;
  color: string;
  brand: string;
}

interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  date: string;
  isRead: boolean;
  ip?: string;
  device?: string;
  recommendedActions?: string[];
}

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalEscrow: number;
  totalVolume: number;
  recentActivity: Activity[];
}

// --- Mock Data for Chart ---
const chartData = [
  { name: "Mon", balance: 1100000 },
  { name: "Tue", balance: 1150000 },
  { name: "Wed", balance: 1120000 },
  { name: "Thu", balance: 1200000 },
  { name: "Fri", balance: 1250000 },
  { name: "Sat", balance: 1250000 },
  { name: "Sun", balance: 1250000 },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [recipientAccounts, setRecipientAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [externalCards, setExternalCards] = useState<ExternalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [isEscrowOpen, setIsEscrowOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isAirtimeOpen, setIsAirtimeOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isBetOpen, setIsBetOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isLinkCardOpen, setIsLinkCardOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const notifiedAlerts = useRef<Set<string>>(new Set());
  const lastBalance = useRef<number | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const triggerNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  useEffect(() => {
    if (isAuthenticated && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        userService.subscribeToUser(firebaseUser.uid, (userData) => {
          if (userData) {
            const newUser = userData as User;
            
            // Notify on significant balance changes
            if (lastBalance.current !== null && newUser.balance !== lastBalance.current) {
              const diff = newUser.balance - lastBalance.current;
              const title = diff > 0 ? "Credit Alert" : "Debit Alert";
              const body = `₦${Math.abs(diff).toLocaleString()} has been ${diff > 0 ? 'credited to' : 'debited from'} your account.`;
              triggerNotification(title, body);
            }
            
            lastBalance.current = newUser.balance;
            setUser(newUser);
            setIsAuthenticated(true);

            // Log session start if first time in this mount
            if (!notifiedAlerts.current.has('session_start')) {
              activityService.addActivity(firebaseUser.uid, {
                type: 'Login',
                detail: `New session started from ${navigator.platform}`
              });
              notifiedAlerts.current.add('session_start');
            }
          }
        });

        // Subscribe to other data
        transactionService.subscribeToTransactions(firebaseUser.uid, setTransactions);
        activityService.subscribeToActivity(firebaseUser.uid, setActivityLog);
        
        alertService.subscribeToAlerts(firebaseUser.uid, (alerts) => {
          setSecurityAlerts(alerts);
          
          // Notify on new high severity alerts
          alerts.forEach(alert => {
            if (alert.severity === "high" && !alert.isRead && !notifiedAlerts.current.has(alert.id)) {
              triggerNotification("Security Alert", alert.title);
              notifiedAlerts.current.add(alert.id);
            }
          });
        });

        recurringPaymentService.subscribeToRecurringPayments(firebaseUser.uid, setRecurringPayments);
        investmentService.subscribeToInvestments(firebaseUser.uid, setInvestments);
        escrowService.subscribeToEscrows(firebaseUser.uid, setEscrows);
        userService.subscribeToRecipientAccounts(firebaseUser.uid, setRecipientAccounts);
        cardService.subscribeToCards(firebaseUser.uid, setCards);
        
        cardService.subscribeToExternalCards(firebaseUser.uid, setExternalCards);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    // This is now handled by subscriptions
  };

  const markAlertsRead = async () => {
    if (!user) return;
    try {
      const unreadAlertIds = securityAlerts.filter(a => !a.isRead).map(a => a.id);
      if (unreadAlertIds.length > 0) {
        await alertService.markAlertsRead(user.id, unreadAlertIds);
      }
    } catch (err) {
      console.error("Failed to mark alerts as read", err);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-primary font-bold text-2xl"
      >
        Viva
      </motion.div>
    </div>
  );

  if (!isAuthenticated) {
    if (isRegistering) {
      return <RegisterScreen onRegister={() => { setIsRegistering(false); setIsAuthenticated(true); }} onBackToLogin={() => setIsRegistering(false)} />;
    }
    return <LoginScreen user={user} onLogin={() => setIsAuthenticated(true)} onGoToRegister={() => setIsRegistering(true)} />;
  }

  return (
    <Router>
      <div className="min-h-screen text-foreground font-sans selection:bg-primary/10">
        <Toaster position="top-center" />
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b border-primary/30 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-all">
                V
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">Viva</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
              <a href="#" className="hover:text-primary transition-colors">Payments</a>
              <a href="#" className="hover:text-primary transition-colors">Escrow</a>
              <a href="#" className="hover:text-primary transition-colors">Cards</a>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> Admin
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center relative group">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border-none text-sm focus:ring-2 focus:ring-primary outline-none w-64 transition-all"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-full md:hidden">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => {
                setIsAlertsOpen(true);
                markAlertsRead();
              }}>
                <Bell className="w-5 h-5" />
                {securityAlerts.some(a => !a.isRead) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full" 
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8 max-w-7xl pb-24 md:pb-8 bg-white/30 dark:bg-black/10 backdrop-blur-sm rounded-[3rem] mt-4">
          <Routes>
            <Route path="/" element={<Dashboard user={user} transactions={transactions} activityLog={activityLog} onRefresh={fetchData} searchQuery={searchQuery} setIsBillsOpen={setIsBillsOpen} setIsEscrowOpen={setIsEscrowOpen} setIsAirtimeOpen={setIsAirtimeOpen} setIsInvestOpen={setIsInvestOpen} externalCards={externalCards} setIsSecurityModalOpen={setIsSecurityModalOpen} recipientAccounts={recipientAccounts} />} />
            <Route path="/profile" element={<Profile user={user} onRefresh={fetchData} setIsUpgradeOpen={setIsUpgradeOpen} setIsAuthenticated={setIsAuthenticated} setIsSecurityModalOpen={setIsSecurityModalOpen} />} />
            <Route path="/settings" element={<AccountSettings user={user} onRefresh={fetchData} />} />
            <Route path="/cards" element={<CardsView user={user} cards={cards} onRefresh={fetchData} />} />
            <Route path="/admin" element={<AdminDashboard user={user} />} />
          </Routes>
        </main>

        <SecurityCenterModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />

        <SecurityAlertsModal 
          isOpen={isAlertsOpen} 
          onClose={() => setIsAlertsOpen(false)} 
          alerts={securityAlerts} 
        />

        <BillsModal 
          isOpen={isBillsOpen} 
          onClose={() => setIsBillsOpen(false)} 
          user={user} 
          recurringPayments={recurringPayments}
          transactions={transactions}
          onRefresh={fetchData} 
        />

        <EscrowModal
          isOpen={isEscrowOpen}
          onClose={() => setIsEscrowOpen(false)}
          user={user}
          onRefresh={fetchData}
          escrows={escrows}
        />
        
        <UpgradeTierModal
          isOpen={isUpgradeOpen}
          onClose={() => setIsUpgradeOpen(false)}
          user={user}
          onRefresh={fetchData}
        />

        <AirtimeModal
          isOpen={isAirtimeOpen}
          onClose={() => setIsAirtimeOpen(false)}
          user={user}
          onRefresh={fetchData}
        />

        <InvestModal 
          isOpen={isInvestOpen} 
          onClose={() => setIsInvestOpen(false)} 
          user={user}
          onRefresh={fetchData}
          investments={investments}
        />

        <BetModal 
          isOpen={isBetOpen} 
          onClose={() => setIsBetOpen(false)} 
          user={user}
          onRefresh={fetchData} 
        />

        <ScanModal 
          isOpen={isScanOpen} 
          onClose={() => setIsScanOpen(false)} 
          user={user}
          onRefresh={fetchData} 
        />

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t z-50 px-6 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex flex-col items-center gap-1 text-primary">
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <button onClick={() => toast.info("Payments feature coming soon")} className="flex flex-col items-center gap-1 text-muted-foreground">
              <Send className="w-6 h-6" />
              <span className="text-[10px] font-medium">Pay</span>
            </button>
            <div className="relative -top-6">
              <button 
                onClick={() => toast.info("Quick Scan coming soon")}
                className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 border-4 border-background"
              >
                <Plus className="w-8 h-8" />
              </button>
            </div>
            <Link to="/cards" className="flex flex-col items-center gap-1 text-muted-foreground">
              <CreditCard className="w-6 h-6" />
              <span className="text-[10px] font-medium">Cards</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-muted-foreground">
              {user?.avatar ? (
                <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/30">
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex flex-col items-center gap-1 text-purple-600">
                <ShieldAlert className="w-6 h-6" />
                <span className="text-[10px] font-medium">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Router>
  );
}

function AddCardModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void }) {
  const [type, setType] = useState("Visa");
  const [brand, setBrand] = useState("Viva Virtual");
  const [color, setColor] = useState("bg-slate-900");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { name: "Midnight", value: "bg-slate-900" },
    { name: "Ocean", value: "bg-gradient-to-br from-blue-600 to-indigo-700" },
    { name: "Sunset", value: "bg-gradient-to-br from-orange-500 to-red-600" },
    { name: "Royal", value: "bg-gradient-to-br from-purple-600 to-blue-600" },
    { name: "Emerald", value: "bg-gradient-to-br from-emerald-600 to-teal-700" }
  ];

  const handleCreate = async () => {
    if (!user) return;
    const cardFee = 1000;
    if (user.balance < cardFee) {
      toast.error("Insufficient balance to create a new virtual card (Fee: ₦1,000).");
      return;
    }

    setIsSubmitting(true);
    try {
      await cardService.addCard(user.id, {
        type,
        number: Math.floor(1000 + Math.random() * 9000).toString(), // Mock parts
        name: user.name.toUpperCase(),
        expiry: "09/28",
        color,
        brand
      });

      await transactionService.addTransaction(user.id, {
        sender: user.accountNumber,
        receiver: "Viva Card Issuance",
        amount: cardFee,
        type: 'subscription', // or card_fee
      });

      toast.success("Virtual card issued successfully! (₦1,000 fee deducted)");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Issue Virtual Card</CardTitle>
                  <CardDescription>Get a new card instantly for online payments.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Card Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Visa", "Mastercard", "Verve"].map(t => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`py-2 rounded-xl border text-sm font-bold transition-all ${
                          type === t ? 'bg-primary text-white border-primary border-2 shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-primary/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Card Name/Label</label>
                  <input 
                    type="text" 
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)} 
                    placeholder="e.g. Shopping Card" 
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pick a Style</label>
                  <div className="flex gap-2">
                    {colors.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        title={c.name}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${c.value} ${
                          color === c.value ? 'border-primary scale-110' : 'border-transparent opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">Issuance Fee: <span className="font-bold text-foreground">₦1,000.00</span></p>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting} onClick={handleCreate}>
                    {isSubmitting ? "Issuing..." : "Create Card"}
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

function CardsView({ user, cards, onRefresh }: { user: User | null, cards: CardData[], onRefresh: () => void }) {
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Cards</h1>
        <Button className="rounded-full" onClick={() => setIsAddCardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          return (
            <VirtualCard 
              key={card.id}
              type={card.type} 
              number={card.number} 
              name={card.name} 
              expiry={card.expiry} 
              color={card.color} 
              brand={card.brand}
            />
          );
        })}
        <div 
          onClick={() => setIsAddCardOpen(true)}
          className="border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer group min-h-[208px]"
        >
          <Plus className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
          <p className="font-medium">Add New Virtual Card</p>
        </div>
      </div>

      <AddCardModal 
        isOpen={isAddCardOpen} 
        onClose={() => setIsAddCardOpen(false)} 
        user={user}
        onRefresh={onRefresh} 
      />
    </motion.div>
  );
}

const VirtualCard: React.FC<{ type: string, number: string, name: string, expiry: string, color: string, brand?: string }> = ({ type, number, name, expiry, color, brand }) => {
  return (
    <Card className={`${color} text-white border-none relative overflow-hidden h-52 group cursor-pointer shadow-xl`}>
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
        <CreditCard className="w-24 h-24" />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="bg-white/10 text-white border-none">{brand || type}</Badge>
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 opacity-50 rotate-90" />
            <div className="w-10 h-6 bg-yellow-500/80 rounded-sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        <p className="text-xl font-mono tracking-widest">**** **** **** {number}</p>
        <div className="flex justify-between mt-8">
          <div>
            <p className="text-[10px] uppercase opacity-50">Card Holder</p>
            <p className="text-sm font-medium">{name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase opacity-50">Expires</p>
            <p className="text-sm font-medium">{expiry}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Profile({ user, onRefresh, setIsUpgradeOpen, setIsAuthenticated, setIsSecurityModalOpen }: { user: User | null, onRefresh: () => void, setIsUpgradeOpen: (open: boolean) => void, setIsAuthenticated: (val: boolean) => void, setIsSecurityModalOpen: (open: boolean) => void }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBVNModalOpen, setIsBVNModalOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const currentLimit = getEffectiveLimit(user?.tier || 1, !!user?.isVerified);
  const tierInfo = (TIER_LIMITS as any)[user?.tier || 1];

  const handleVerifyBVN = async () => {
    if (!user) return;
    try {
      await userService.updateProfile(user.id, { 
        isVerified: true,
        transferLimit: getEffectiveLimit(user.tier, true)
      });
      toast.success("Identity verified successfully!");
      onRefresh();
    } catch (err) {
      toast.error("Verification failed");
    }
  };

  const toggle2FA = async () => {
    if (!user) return;
    try {
      await userService.updateProfile(user.id, { is2FAEnabled: !user.is2FAEnabled });
      toast.success(`2FA ${!user.is2FAEnabled ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const toggleBiometrics = async () => {
    if (!user) return;
    try {
      await userService.updateProfile(user.id, { isBiometricEnabled: !user.isBiometricEnabled });
      toast.success(`Biometrics ${!user.isBiometricEnabled ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* ... Profile header as is ... */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-12 h-12 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-muted-foreground">{user?.accountNumber}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(user?.accountNumber || "");
                toast.success("Account number copied");
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge 
              variant="secondary" 
              onClick={() => !user?.isVerified && setIsBVNModalOpen(true)}
              className={`border-none ${user?.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200'}`}
            >
              {user?.isVerified ? 'Verified' : 'Unverified'}
            </Badge>
            <Badge className="bg-primary text-primary-foreground border-none">Tier {user?.tier}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="p-6 rounded-3xl bg-secondary/30 border border-muted">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Zap className="w-4 h-4" /> Transfer Limits
            </h3>
            {user?.tier && user.tier < 3 && (
              <Button variant="ghost" size="sm" className="text-[10px] h-6 text-primary hover:bg-primary/10" onClick={() => setIsUpgradeOpen(true)}>
                Upgrade Tier
              </Button>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-3xl font-black text-primary">₦{currentLimit.toLocaleString()}</p>
                <p className="text-xs font-semibold text-emerald-600">Current Level</p>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: user?.isVerified ? '100%' : '50%' }}
                  className="h-full bg-gradient-to-r from-primary to-primary/80"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                <Info className="w-3 h-3" />
                {user?.isVerified 
                  ? `Maximum daily transfer for Tier ${user?.tier} verified accounts.` 
                  : (
                    <button 
                      onClick={() => setIsBVNModalOpen(true)}
                      className="hover:text-primary transition-colors text-left font-bold"
                    >
                      {`Verify your account to increase Tier ${user?.tier} limit to ₦${getEffectiveLimit(user?.tier || 1, true).toLocaleString()}`}
                    </button>
                  )}
              </p>
            </div>
          </div>
        </div>

        {!user?.isVerified && (
          <div 
            onClick={handleVerifyBVN}
            className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-200 flex items-center justify-center text-orange-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-orange-800">Complete Verification</p>
                <p className="text-xs text-orange-700">Add your BVN to remove account limits</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-700" />
          </div>
        )}

        <ProfileItem 
          onClick={() => setIsEditModalOpen(true)}
          icon={<UserIcon className="w-5 h-5" />} 
          label="Edit Personal Info" 
        />
        
        <ProfileItem 
          onClick={() => setIsAddBankModalOpen(true)}
          icon={<Building2 className="w-5 h-5" />} 
          label="Add Bank Account (BIN)" 
        />

        <ProfileItem 
          onClick={() => navigate("/settings")}
          icon={<Settings className="w-5 h-5" />} 
          label="Account Settings" 
        />
        
        <ProfileItem icon={<Bell className="w-5 h-5" />} label="Notification History" />
        <ProfileItem 
          onClick={() => setIsSecurityModalOpen(true)}
          icon={<ShieldCheck className="w-5 h-5" />} 
          label="Security Center" 
        />

        <div className="pt-4">
          <Button 
            variant="destructive" 
            className="w-full rounded-2xl h-12 gap-2"
            onClick={async () => {
              await signOut(auth);
              toast.success("Successfully logged out");
            }}
          >
            <LogOut className="w-5 h-5" /> Log Out
          </Button>
        </div>
      </div>

      <EditProfileModal user={user} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onRefresh={onRefresh} />
      <BVNModal user={user} isOpen={isBVNModalOpen} onClose={() => setIsBVNModalOpen(false)} onRefresh={onRefresh} />
      <AddBankModal isOpen={isAddBankModalOpen} onClose={() => setIsAddBankModalOpen(false)} />
    </motion.div>
  );
}

function AccountSettings({ user, onRefresh }: { user: User | null, onRefresh: () => void }) {
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    securityAlerts: true,
    marketing: false
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification setting updated");
  };

  const handleUpdateSecurity = async () => {
    toast.success("Security settings updated successfully");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-4 mb-4">
        <Link to="/profile" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Link>
        <h2 className="text-2xl font-bold">Account Settings</h2>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>Manage how you receive alerts and updates</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          <SettingsToggle 
            label="Push Notifications" 
            description="Receive instant alerts on your device"
            active={notifications.push}
            onToggle={() => toggleNotification('push')}
          />
          <SettingsToggle 
            label="Email Alerts" 
            description="Receive transaction summaries via email"
            active={notifications.email}
            onToggle={() => toggleNotification('email')}
          />
          <SettingsToggle 
            label="Security Alerts Only" 
            description="Only notify for high-risk security events"
            active={notifications.securityAlerts}
            onToggle={() => toggleNotification('securityAlerts')}
          />
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Security Settings
          </CardTitle>
          <CardDescription>Protect your account with advanced features</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          <SettingsToggle 
            label="Biometric Login" 
            description="Use Face ID or Touch ID"
            active={!!user?.isBiometricEnabled}
            onToggle={async () => {
              if (user) {
                await userService.updateProfile(user.id, { isBiometricEnabled: !user.isBiometricEnabled });
                toast.success(`Biometric Login ${!user.isBiometricEnabled ? 'enabled' : 'disabled'}`);
                onRefresh();
              }
            }}
          />
          <SettingsToggle 
            label="Two-Factor Authentication" 
            description="Verify high-value transfers"
            active={!!user?.is2FAEnabled}
            onToggle={async () => {
              if (user) {
                await userService.updateProfile(user.id, { is2FAEnabled: !user.is2FAEnabled });
                toast.success(`2FA ${!user.is2FAEnabled ? 'enabled' : 'disabled'}`);
                onRefresh();
              }
            }}
          />
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => toast.info("Change password feature coming soon")}>
            <div>
              <p className="font-medium text-sm">Change Password</p>
              <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleUpdateSecurity}>
          Save All Changes
        </Button>
      </div>
    </motion.div>
  );
}

function SettingsToggle({ label, description, active, onToggle }: { label: string, description: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-colors relative ${active ? 'bg-primary' : 'bg-slate-200'}`}
      >
        <motion.div 
          animate={{ x: active ? 22 : 2 }}
          className="absolute top-0.5 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

function AddBankModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Bank account linked successfully!");
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Link Bank Account</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Bank</label>
                  <select value={bank} onChange={(e) => setBank(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none">
                    <option value="">Select a bank</option>
                    <option value="access">Access Bank</option>
                    <option value="firstbank">First Bank of Nigeria</option>
                    <option value="gtb">GTBank</option>
                    <option value="zenith">Zenith Bank</option>
                    <option value="uba">United Bank for Africa (UBA)</option>
                    <option value="fcmb">FCMB</option>
                    <option value="union">Union Bank</option>
                    <option value="eco">Eco Bank</option>
                    <option value="polaris">Polaris Bank</option>
                    <option value="kuda">Kuda MFB</option>
                    <option value="opay">OPay</option>
                    <option value="palmpay">PalmPay</option>
                    <option value="fairmoney">Fairmoney</option>
                    <option value="branch">Branch</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Number</label>
                  <input type="text" maxLength={10} value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))} placeholder="0123456789" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none" />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl" disabled={isSubmitting || !bank || account.length !== 10} onClick={handleAdd}>
                    {isSubmitting ? "Linking..." : "Link Bank"}
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

const AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
];

function EditProfileModal({ user, isOpen, onClose, onRefresh }: { user: User | null, isOpen: boolean, onClose: () => void, onRefresh: () => void }) {
  const [name, setName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setPhoneNumber(user?.phoneNumber || "");
    setAvatar(user?.avatar || "");
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await userService.updateProfile(user.id, { name, phoneNumber, avatar });
      toast.success("Profile updated");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Edit Profile</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/30 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {AVATARS.map((url, i) => (
                      <button 
                        key={i} 
                        onClick={() => setAvatar(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${avatar === url ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} alt={`Option ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button 
                      onClick={() => setAvatar("")}
                      className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 transition-all ${!avatar ? 'border-primary' : 'border-transparent'}`}
                    >
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full pl-10 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl" disabled={isSubmitting} onClick={handleUpdate}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
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

function BVNModal({ user, isOpen, onClose, onRefresh }: { user: User | null, isOpen: boolean, onClose: () => void, onRefresh: () => void }) {
  const [bvn, setBvn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (!user) return;
    if (bvn.length !== 11) {
      toast.error("BVN must be 11 digits");
      return;
    }
    setIsSubmitting(true);
    try {
      await userService.updateProfile(user.id, { 
        bvn,
        isVerified: true
      });
      toast.success("BVN Verified Successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>BVN Verification</CardTitle>
                  <CardDescription>Your security is our priority.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <p>Dial <span className="font-bold">*565*0#</span> on your registered phone number to get your BVN.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">11-Digit BVN</label>
                  <input type="text" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} placeholder="222XXXXXXXX" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none text-center text-xl font-bold tracking-widest" />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl" disabled={isSubmitting || bvn.length !== 11} onClick={handleVerify}>
                    {isSubmitting ? "Verifying..." : "Verify BVN"}
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

function AdminDashboard({ user }: { user: User | null }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers()
      ]);
      setStats(statsData);
      setAllUsers(usersData);
    } catch (err) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const handlePromote = async (targetUserId: string, targetUserName: string) => {
    if (!window.confirm(`Are you sure you want to promote ${targetUserName} to Admin? This gives them full system access.`)) return;
    setIsPromoting(targetUserId);
    try {
      await adminService.promoteToAdmin(targetUserId);
      toast.success(`${targetUserName} is now an Admin`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user");
    } finally {
      setIsPromoting(null);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="text-center py-20"><p className="text-destructive font-bold text-xl">Unauthorized Access</p></div>;
  }

  if (loading) return <div className="text-center py-20">Loading system data...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground text-sm">Monitor platform growth and manage security roles.</p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-none px-4 py-1.5 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Root Access
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats?.totalUsers || 0} color="text-blue-600" />
        <AdminStatCard icon={<ActivityIcon className="w-6 h-6" />} label="Transactions" value={stats?.totalTransactions || 0} color="text-emerald-600" />
        <AdminStatCard icon={<ShieldCheck className="w-6 h-6" />} label="Escrow Count" value={stats?.totalEscrow || 0} color="text-purple-600" />
        <AdminStatCard icon={<Wallet className="w-6 h-6" />} label="Total Volume" value={`₦${stats?.totalVolume.toLocaleString()}`} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-primary/20 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-primary" /> User Management
                </CardTitle>
                <Badge variant="outline">{allUsers.length} Total</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-muted-foreground text-left">
                      <th className="px-6 py-3 font-semibold">User Details</th>
                      <th className="px-6 py-3 font-semibold">Join Date</th>
                      <th className="px-6 py-3 font-semibold">Role</th>
                      <th className="px-6 py-3 font-semibold">Balance</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={u.role === 'admin' ? 'bg-purple-600' : ''}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">₦{u.balance?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 text-right">
                          {u.role !== 'admin' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs gap-1.5"
                              disabled={isPromoting === u.id}
                              onClick={() => handlePromote(u.id, u.name)}
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Promote
                            </Button>
                          )}
                          {u.role === 'admin' && u.id !== user?.id && (
                            <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Privileged
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border border-primary/20 shadow-sm bg-primary/5">
            <CardHeader><CardTitle className="text-lg">Risk Controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Select a user from the management list to adjust their system-wide risk flags.</p>
              <div className="p-4 rounded-xl bg-background border border-primary/10 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Global Policy</p>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  {['Standard', 'Strict', 'Safe'].map(p => (
                    <Button key={p} variant="outline" size="sm" className="flex-1 text-[10px] h-8">{p}</Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/20 shadow-sm">
            <CardHeader><CardTitle className="text-lg">System Logs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {stats?.recentActivity.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-semibold">{log.type}</p>
                      <p className="text-xs text-muted-foreground">{log.detail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(log.date).toLocaleTimeString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function AdminStatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <Card className="border border-primary/20 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-slate-100 ${color}`}>{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-2xl bg-background border hover:bg-slate-50 transition-colors group text-left">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}

function TransferConfirmModal({ isOpen, onClose, onConfirm, recipient, recipientName, amount, fee, bank }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, recipient: string, recipientName: string, amount: string, fee: number, bank: string }) {
  const total = parseFloat(amount) + fee;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader>
                <CardTitle className="text-center">Confirm Transfer</CardTitle>
                <CardDescription className="text-center">Review your transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Send className="w-8 h-8" />
                  </div>
                  <p className="text-3xl font-black text-primary">₦{parseFloat(amount).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Amount to Send</p>
                </div>

                <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-muted">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-bold">{recipientName || recipient}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-mono">{recipient}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-bold">{bank}</span>
                  </div>
                  <div className="border-t border-dashed my-2" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Transfer Fee</span>
                    <span>₦{fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-black">
                    <span>Total Amount</span>
                    <span className="text-primary">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Edit</Button>
                  <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" onClick={onConfirm}>Confirm & Send</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Dashboard({ user, transactions, activityLog, onRefresh, searchQuery, setIsBillsOpen, setIsEscrowOpen, setIsAirtimeOpen, setIsInvestOpen, externalCards, setIsSecurityModalOpen, recipientAccounts }: { user: User | null, transactions: Transaction[], activityLog: Activity[], onRefresh: () => void, searchQuery: string, setIsBillsOpen: (open: boolean) => void, setIsEscrowOpen: (open: boolean) => void, setIsAirtimeOpen: (open: boolean) => void, setIsInvestOpen: (open: boolean) => void, externalCards: ExternalCard[], setIsSecurityModalOpen: (open: boolean) => void, recipientAccounts: any[] }) {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isReceiveDetailsOpen, setIsReceiveDetailsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("Viva");
  const [sourceBank, setSourceBank] = useState("First Bank");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBetOpen, setIsBetOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isBVNModalOpen, setIsBVNModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLinkCardOpen, setIsLinkCardOpen] = useState(false);
  const [isTransferConfirmOpen, setIsTransferConfirmOpen] = useState(false);
  const [resolvedRecipientName, setResolvedRecipientName] = useState("");
  const [transferFee, setTransferFee] = useState(0);
  const [selectedExternalCard, setSelectedExternalCard] = useState<ExternalCard | null>(null);

  const currentLimit = getEffectiveLimit(user?.tier || 1, !!user?.isVerified);

  const recentRecipients = useMemo(() => {
    // Filter for transfers/bills where user was the sender, ordered by date desc (handled by service)
    const historyRecipients = transactions
      .filter(tx => (tx.type === 'transfer' || tx.type === 'bill') && tx.sender === user?.accountNumber)
      .map(tx => {
        // Extract account number if format is "Name (Account)"
        const match = tx.receiver.match(/\(([^)]+)\)/);
        return match ? match[1] : tx.receiver;
      });
    
    // Get unique recipients preserving order
    const uniqueHistory = Array.from(new Set(historyRecipients))
      .filter(name => !name.includes("@")); // Extra safety
    
    // Fallback beneficiaries - using account-number-like defaults
    const defaults = ["8123456789", "8990123456", "Support", "Electricity"];
    
    // Combine and limit to 5
    const combined = Array.from(new Set([...uniqueHistory, ...defaults])).slice(0, 5);
    return combined;
  }, [transactions, user]);

  const handleQuickTransfer = (name: string) => {
    setRecipient(name);
    setIsTransferOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSensitiveAction = (action: () => void) => {
    if (user?.is2FAEnabled) {
      setPendingAction(() => action);
      setIs2FAModalOpen(true);
    } else {
      action();
    }
  };

  const on2FAVerified = () => {
    setIs2FAModalOpen(false);
    pendingAction();
  };

  const filteredTransactions = transactions.filter(tx => {
    const query = searchQuery.toLowerCase();
    return (
      tx.sender.toLowerCase().includes(query) ||
      tx.receiver.toLowerCase().includes(query) ||
      tx.amount.toString().includes(query) ||
      tx.type.toLowerCase().includes(query)
    );
  });

  const handleTransfer = async () => {
    if (!recipient || !amount || !user) {
      toast.error("Please fill in all fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }

    const limit = getEffectiveLimit(user.tier, user.isVerified);
    if (numAmount > limit) {
      toast.error(`Amount exceeds your tier ${user.tier} limit of ₦${limit.toLocaleString()}`);
      return;
    }

    setIsTransferConfirmOpen(false);
    setIsSubmitting(true);
    try {
      const isViva = !selectedBank || selectedBank === "Viva";
      let finalRecipientName = recipient;

      if (isViva) {
        const recipientUser: any = await userService.findUserByAccountNumber(recipient);
        if (recipientUser) {
          finalRecipientName = recipientUser.name;
          await transactionService.addTransaction(recipientUser.id, {
            type: 'receive',
            amount: numAmount,
            sender: user.accountNumber,
            receiver: recipientUser.accountNumber,
            bank: 'Viva'
          });
        }
      }

      await transactionService.addTransaction(user.id, {
        type: 'transfer',
        amount: numAmount,
        receiver: isViva ? (finalRecipientName === recipient ? recipient : `${finalRecipientName} (${recipient})`) : `${recipient} (${selectedBank})`,
        sender: user.accountNumber,
        bank: selectedBank || 'Viva'
      });

      toast.success(`₦${amount} sent to ${finalRecipientName} via ${selectedBank}`);
      setIsTransferOpen(false);
      setRecipient("");
      setAmount("");
      setSelectedBank("Viva");
      setResolvedRecipientName("");
    } catch (err: any) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateTransferValidation = async () => {
    if (!recipient || !amount || !user) {
      toast.error("Please fill in all fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }

    const limit = getEffectiveLimit(user.tier, user.isVerified);
    if (numAmount > limit) {
      toast.error(`Amount exceeds your tier ${user.tier} limit of ₦${limit.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const isViva = !selectedBank || selectedBank === "Viva";
      setTransferFee(isViva ? 0 : 25); // Example fee for external transfers

      if (isViva) {
        const recipientUser: any = await userService.findUserByAccountNumber(recipient);
        if (recipientUser) {
          setResolvedRecipientName(recipientUser.name);
        } else {
          setResolvedRecipientName(recipient);
        }
      } else {
        setResolvedRecipientName(recipient);
      }
      
      setIsTransferConfirmOpen(true);
    } catch (err) {
      console.error("Validation error", err);
      toast.error("Error validating transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!user) return;
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const senderName = selectedExternalCard 
        ? `${selectedExternalCard.bank} (**** ${selectedExternalCard.last4})` 
        : sourceBank;

      await transactionService.addTransaction(user.id, {
        type: 'deposit',
        amount: parseFloat(amount),
        sender: senderName,
        receiver: 'Me'
      });
      
      toast.success(`₦${amount} added successfully!`);
      setIsAddMoneyOpen(false);
      setAmount("");
      setSelectedExternalCard(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to add money");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">Viva</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleRefresh}>
              <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-primary/30 cursor-pointer hover:border-primary transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Balance Card - OPay Inspired */}
        <Card className="bg-white text-foreground border border-primary/30 shadow-2xl relative overflow-hidden p-6 rounded-[2.5rem]">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-primary/10 z-20">
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Acct: {user?.accountNumber}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(user?.accountNumber || "");
                toast.success("Account number copied");
              }}
              className="text-primary hover:scale-110 transition-transform"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Available Balance</p>
              <h2 className="text-4xl font-bold tracking-tight text-primary">₦{user?.balance.toLocaleString()}.00</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-4">
              <ActionItem icon={<Plus className="w-5 h-5" />} label="Add Money" onClick={() => setIsAddMoneyOpen(true)} />
              <ActionItem icon={<Send className="w-5 h-5" />} label="Transfer" onClick={() => setIsTransferOpen(true)} />
              <ActionItem icon={<ArrowDownLeft className="w-5 h-5" />} label="Receive" onClick={() => setIsReceiveDetailsOpen(true)} />
              <ActionItem icon={<ArrowUpRight className="w-5 h-5" />} label="Withdraw" onClick={() => setIsWithdrawOpen(true)} />
            </div>
          </div>
        </Card>
      </header>

      {/* Quick Transfer Section */}
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Quick Transfer</h3>
            <Badge className="bg-primary/10 text-primary border-none text-[8px] h-4 py-0">Recent</Badge>
          </div>
          <button className="text-[10px] font-bold text-primary hover:underline" onClick={() => setIsTransferOpen(true)}>See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {recentRecipients.map((name, i) => (
            <button 
              key={i} 
              onClick={() => handleQuickTransfer(name)}
              className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-2xl bg-card border border-muted shadow-sm flex items-center justify-center relative overflow-hidden group-hover:border-primary/50 group-hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-slate-50 opacity-50" />
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative z-10 transition-transform group-hover:scale-105">
                  <span className="text-sm font-black text-primary">{name.charAt(0)}</span>
                </div>
                {i < 3 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white" title="Online" />
                )}
              </div>
              <span className="text-[10px] font-black text-slate-600 text-center w-14 truncate uppercase tracking-tighter">
                {name.split(' ')[0]}
              </span>
            </button>
          ))}
          <button 
            onClick={() => setIsTransferOpen(true)}
            className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-100 hover:border-slate-400 transition-all">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-[10px] font-black text-slate-400 text-center w-14 uppercase tracking-tighter">Add</span>
          </button>
        </div>
      </div>



      {/* OPay/PalmPay Style Quick Services */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        <ServiceIcon icon={<Smartphone className="w-6 h-6 text-blue-500" />} label="Airtime" onClick={() => setIsAirtimeOpen(true)} />
        <ServiceIcon icon={<Globe className="w-6 h-6 text-emerald-500" />} label="Data" onClick={() => setIsAirtimeOpen(true)} />
        <ServiceIcon icon={<Building2 className="w-6 h-6 text-orange-500" />} label="Bills" onClick={() => setIsBillsOpen(true)} />
        <ServiceIcon icon={<Gamepad2 className="w-6 h-6 text-purple-500" />} label="Betting" onClick={() => setIsBetOpen(true)} />
        <ServiceIcon icon={<QrCode className="w-6 h-6 text-slate-700" />} label="Scan" onClick={() => setIsScanOpen(true)} />
        <ServiceIcon icon={<TrendingUp className="w-6 h-6 text-red-500" />} label="Invest" onClick={() => setIsInvestOpen(true)} />
        <ServiceIcon icon={<ShieldCheck className="w-6 h-6 text-indigo-500" />} label="Escrow" onClick={() => setIsEscrowOpen(true)} />
        <ServiceIcon icon={<Plus className="w-6 h-6 text-slate-400" />} label="More" onClick={() => setIsMoreOpen(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts & Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Promotional Banner - Real App Feel */}
          <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 text-white border border-primary/30 overflow-hidden h-32 rounded-[2rem] flex items-center px-8 relative group cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-primary/20">
            <div className="absolute top-0 right-0 h-full opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
              <Plus className="w-48 h-48 -mr-16 rotate-12" />
            </div>
            <div className="space-y-1 relative z-10">
              <Badge className="bg-yellow-400 text-black border-none text-[10px] uppercase font-black px-2 mb-2">Exclusive</Badge>
              <h3 className="text-xl font-black">Get ₦2,000 Cash Back!</h3>
              <p className="text-xs text-blue-100">When you invite 5 friends to Viva this week.</p>
            </div>
          </Card>

          {/* Activity Chart */}
          <Card className="border border-primary/20 shadow-sm bg-background/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Account Activity</CardTitle>
                <CardDescription>Your spending vs savings this week</CardDescription>
              </div>
              <Tabs defaultValue="week">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Virtual Cards Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">My Virtual Cards</h2>
              <Button variant="ghost" size="sm" className="text-primary">Manage</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900 text-white border border-primary/50 relative overflow-hidden h-48 group cursor-pointer">
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-24 h-24" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white/10 text-white border-none">Virtual Visa</Badge>
                    <div className="w-10 h-6 bg-yellow-500/80 rounded-sm" />
                  </div>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-lg font-mono tracking-widest">**** **** **** 4290</p>
                  <div className="flex justify-between mt-6">
                    <div>
                      <p className="text-[10px] uppercase opacity-50">Card Holder</p>
                      <p className="text-sm font-medium">WISDOM IDEMUDIA</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-50">Expires</p>
                      <p className="text-sm font-medium">08/27</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border border-primary/50 relative overflow-hidden h-48 group cursor-pointer">
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-24 h-24" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white/10 text-white border-none">Business Master</Badge>
                    <div className="w-10 h-6 bg-slate-200/20 rounded-sm" />
                  </div>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-lg font-mono tracking-widest">**** **** **** 8812</p>
                  <div className="flex justify-between mt-6">
                    <div>
                      <p className="text-[10px] uppercase opacity-50">Card Holder</p>
                      <p className="text-sm font-medium">WISDOM IDEMUDIA</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-50">Expires</p>
                      <p className="text-sm font-medium">12/26</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Recent Transactions */}
        <div className="space-y-8">
          {/* Activity Log Section */}
          <Card 
            onClick={() => setIsSecurityModalOpen(true)}
            className="border border-primary/20 shadow-sm h-[300px] flex flex-col cursor-pointer hover:border-primary/50 transition-all group"
          >
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                <History className="w-5 h-5 text-primary" />
                Security Activity
              </CardTitle>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {activityLog.map((log) => (
                <div key={log.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div className="w-px flex-1 bg-slate-100 group-last:bg-transparent my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold">{log.type}</p>
                    <p className="text-xs text-muted-foreground">{log.detail}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={<CreditCard className="w-5 h-5" />} label="Cards" color="bg-blue-500" />
            <QuickAction icon={<ShieldCheck className="w-5 h-5" />} label="Escrow" color="bg-purple-500" />
            <QuickAction icon={<ArrowDownLeft className="w-5 h-5" />} label="Withdraw" color="bg-orange-500" />
            <QuickAction icon={<History className="w-5 h-5" />} label="History" color="bg-slate-500" />
          </div>

          {/* Recent Transactions */}
          <Card className="border border-primary/20 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {searchQuery ? "Search Results" : "Recent Transactions"}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">View All</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{searchQuery ? "No results found" : "No transactions yet"}</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTransaction(tx)}
                    className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 p-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 
                        tx.type === 'escrow' ? 'bg-purple-100 text-purple-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : 
                         tx.type === 'escrow' ? <ShieldCheck className="w-5 h-5" /> :
                         <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm truncate max-w-[120px]">
                          {tx.receiver === user?.accountNumber ? tx.sender : tx.receiver}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        tx.type === 'deposit' ? 'text-emerald-600' : 
                        tx.type === 'escrow' ? 'text-purple-600' :
                        'text-foreground'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 uppercase leading-none">
                        {tx.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal 
        isOpen={is2FAModalOpen} 
        onClose={() => setIs2FAModalOpen(false)} 
        onVerified={on2FAVerified} 
      />

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>Full details of your transaction.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTransaction(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-4 space-y-2">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      selectedTransaction.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 
                      selectedTransaction.type === 'escrow' ? 'bg-purple-100 text-purple-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedTransaction.type === 'deposit' ? <ArrowDownLeft className="w-8 h-8" /> : 
                       selectedTransaction.type === 'escrow' ? <ShieldCheck className="w-8 h-8" /> :
                       <ArrowUpRight className="w-8 h-8" />}
                    </div>
                    <p className={`text-3xl font-bold ${
                      selectedTransaction.type === 'deposit' ? 'text-emerald-600' : 'text-foreground'
                    }`}>
                      {selectedTransaction.type === 'deposit' ? '+' : '-'}₦{selectedTransaction.amount.toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="uppercase px-3">
                      {selectedTransaction.type}
                    </Badge>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Sender</span>
                      <span className="font-medium truncate max-w-[200px]">{selectedTransaction.sender}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Receiver</span>
                      <span className="font-medium truncate max-w-[200px]">{selectedTransaction.receiver}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs text-muted-foreground uppercase">{selectedTransaction.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Date & Time</span>
                      <span className="font-medium">
                        {new Date(selectedTransaction.date).toLocaleDateString()} {new Date(selectedTransaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => toast.info("Report feature coming soon")}>
                      Report Issue
                    </Button>
                    <Button className="flex-1 rounded-xl" onClick={() => setSelectedTransaction(null)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Money Modal */}
      <AnimatePresence>
        {isAddMoneyOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg"
            >
              <Card className="shadow-2xl border border-primary/20 overflow-hidden rounded-[2.5rem]">
                <CardHeader className="bg-primary/5 pb-8 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <ArrowDownCircle className="w-6 h-6 text-primary" />
                        Add Money
                      </CardTitle>
                      <CardDescription className="pt-1">Choose your preferred method to top up.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsAddMoneyOpen(false)} className="rounded-full hover:bg-primary/10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <Tabs defaultValue="card" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-2xl h-14 bg-secondary/50 p-1 mb-6">
                      <TabsTrigger value="card" className="rounded-xl font-bold data-[state=active]:shadow-sm data-[state=active]:bg-background">
                        <CreditCard className="w-4 h-4 mr-2" /> Bank Card
                      </TabsTrigger>
                      <TabsTrigger value="transfer" className="rounded-xl font-bold data-[state=active]:shadow-sm data-[state=active]:bg-background">
                        <Building2 className="w-4 h-4 mr-2" /> Transfer
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="card" className="space-y-6 mt-0">
                      {/* Amount Input */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Amount to Add</label>
                          {amount && <span className="text-xs font-bold text-primary">Fee: ₦0.00</span>}
                        </div>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-400 group-focus-within:text-primary transition-colors">₦</div>
                          <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00" 
                            className="w-full h-20 pl-14 pr-6 rounded-3xl border-2 border-transparent bg-slate-50 dark:bg-slate-900 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all text-3xl font-black outline-none tracking-tight"
                          />
                        </div>
                      </div>

                      {/* Quick Amounts */}
                      <div className="grid grid-cols-4 gap-2">
                        {[1000, 2000, 5000, 10000].map(v => (
                          <button 
                            key={v} 
                            onClick={() => setAmount(v.toString())} 
                            className={`py-3 rounded-2xl border font-bold transition-all ${
                              amount === v.toString() 
                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                                : "bg-background border-muted hover:border-primary/50 hover:bg-primary/5 active:scale-95"
                            }`}
                          >
                            <span className="text-[10px] block opacity-70">₦</span>
                            <span className="text-sm">{v.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Select Card</label>
                          <button 
                            onClick={() => setIsLinkCardOpen(true)}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            + Add New
                          </button>
                        </div>
                        
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                          {externalCards.length > 0 ? (
                            externalCards.map(card => (
                              <button
                                key={card.id}
                                onClick={() => {
                                  setSelectedExternalCard(card);
                                  setSourceBank(card.bank);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                  selectedExternalCard?.id === card.id 
                                    ? "border-primary bg-primary/5 shadow-md" 
                                    : "bg-background border-muted hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                                    card.bank.toLowerCase().includes('kuda') ? 'bg-purple-100 text-purple-700' :
                                    card.bank.toLowerCase().includes('gtbank') ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {card.bank[0]}
                                  </div>
                                  <div className="text-left">
                                    <p className="font-bold tracking-tight">{card.bank}</p>
                                    <p className="text-xs text-muted-foreground font-medium">•••• {card.last4} • {card.type}</p>
                                  </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedExternalCard?.id === card.id ? "border-primary bg-primary" : "border-muted"}`}>
                                  {selectedExternalCard?.id === card.id && <Check className="w-4 h-4 text-white" />}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-muted">
                              <p className="text-sm text-muted-foreground font-medium">No cards linked yet.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button 
                        className="w-full h-16 rounded-[1.25rem] text-lg font-black shadow-xl shadow-primary/20" 
                        disabled={isSubmitting || !amount || (!selectedExternalCard && !sourceBank)}
                        onClick={handleReceive}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5 animate-spin" /> Processing...
                          </span>
                        ) : "Add Money Now"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="transfer" className="space-y-6 mt-0">
                      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary to-emerald-600 text-white shadow-2xl relative overflow-hidden group">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
                        
                        <div className="relative space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Virtual Account</span>
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs opacity-70 font-bold mb-1">Account Number</p>
                            <div className="flex items-center gap-3">
                              <p className="text-3xl font-black tracking-widest">{user?.accountNumber}</p>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(user?.accountNumber || "");
                                  toast.success("Account copied");
                                }}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs opacity-70 font-bold mb-1">Bank Name</p>
                              <p className="text-xl font-black tracking-tight">Viva Bank</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-70 font-bold mb-1">Account Name</p>
                              <p className="text-sm font-bold truncate max-w-[150px]">{user?.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold">Instant Top-up</p>
                            <p className="text-xs text-muted-foreground">Your balance will update automatically as soon as the transfer is successful.</p>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Notice</p>
                            <p className="text-xs text-amber-700 dark:text-amber-500">Only transfer money from an account that matches your Viva name to avoid delays.</p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full h-14 rounded-2xl font-bold gap-2 border-2 hover:bg-secondary/50"
                        onClick={() => {
                          const text = `Bank: Viva Bank\nAccount: ${user?.accountNumber}\nName: ${user?.name}`;
                          navigator.clipboard.writeText(text);
                          toast.success("All details copied");
                        }}
                      >
                        <Share2 className="w-5 h-5" /> Copy All Details
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="bg-secondary/20 p-4 flex justify-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> PCI-DSS COMPLIANT • SECURE ENCRYPTION
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receive Details Modal */}
      <AnimatePresence>
        {isReceiveDetailsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
              <Card className="border border-primary/30 shadow-2xl overflow-hidden rounded-[2.5rem]">
                <div className="bg-primary p-8 text-center text-primary-foreground relative">
                  <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => setIsReceiveDetailsOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl">
                    <QrCode className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Receive Money</h3>
                  <p className="text-primary-foreground/70 text-sm">Scan to pay Wisdom</p>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex justify-between items-center group">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Bank Name</p>
                        <p className="font-bold">Viva Bank</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Active</Badge>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex justify-between items-center group">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Account Number</p>
                        <p className="font-bold text-lg tracking-wider">{user?.accountNumber}</p>
                      </div>
                      <button onClick={() => {
                        navigator.clipboard.writeText(user?.accountNumber || "");
                        toast.success("Account copied");
                      }} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm">
                        <Copy className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 h-12 rounded-xl gap-2" variant="outline" onClick={() => toast.success("Sharing details...")}>
                      <Share2 className="w-4 h-4" /> Share
                    </Button>
                    <Button className="flex-1 h-12 rounded-xl gap-2" onClick={() => toast.success("Downloading slip...")}>
                      <Download className="w-4 h-4" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <WithdrawModal 
              isOpen={isWithdrawOpen} 
              onClose={() => setIsWithdrawOpen(false)} 
              user={user} 
              recipientAccounts={recipientAccounts}
              onRefresh={onRefresh}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {isTransferOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Send Money</CardTitle>
                    <CardDescription>Transfer funds instantly to any Viva user.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsTransferOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Bank</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <select 
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full pl-10 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                      >
                        <option value="Viva">Viva (Recommended)</option>
                        <option value="AccessBank">Access Bank</option>
                        <option value="UBA">United Bank for Africa (UBA)</option>
                        <option value="Zenith">Zenith Bank</option>
                        <option value="FirstBank">First Bank of Nigeria</option>
                        <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                        <option value="FCMB">First City Monument Bank (FCMB)</option>
                        <option value="UnionBank">Union Bank of Nigeria</option>
                        <option value="EcoBank">EcoBank</option>
                        <option value="Sterling">Sterling Bank</option>
                        <option value="Polaris">Polaris Bank</option>
                        <option value="Kuda">Kuda Microfinance Bank</option>
                        <option value="Moniepoint">Moniepoint MFB</option>
                        <option value="OPay">OPay Digital Services</option>
                        <option value="PalmPay">PalmPay Limited</option>
                        <option value="Fairmoney">Fairmoney MFB</option>
                        <option value="Branch">Branch International</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground rotate-90" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {selectedBank === "Viva" ? "Recipient Account Number" : "Account Number"}
                    </label>
                    <input 
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder={selectedBank === "Viva" ? "8123456789" : "0123456789"} 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Amount (₦)</label>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2 rounded-full">
                          Daily Limit: ₦{currentLimit.toLocaleString()}
                        </span>
                        {!user?.isVerified && (
                          <button 
                            onClick={() => setIsBVNModalOpen(true)}
                            className="text-[8px] text-orange-600 font-bold mt-1 uppercase tracking-tighter hover:underline"
                          >
                            Verify BVN to increase to ₦{getEffectiveLimit(user?.tier || 1, true).toLocaleString()}
                          </button>
                        )}
                      </div>
                    </div>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all text-2xl font-bold"
                    />
                    {Number(amount) > currentLimit && (
                      <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> 
                        Amount exceeds your {user?.isVerified ? "Daily" : "Unverified"} limit.
                      </p>
                    )}
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
                    <Button 
                      className="flex-1 rounded-xl" 
                      disabled={isSubmitting}
                      onClick={initiateTransferValidation}
                    >
                      {isSubmitting ? "Processing..." : "Continue"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TransferConfirmModal 
        isOpen={isTransferConfirmOpen}
        onClose={() => setIsTransferConfirmOpen(false)}
        onConfirm={() => handleSensitiveAction(handleTransfer)}
        recipient={recipient}
        recipientName={resolvedRecipientName}
        amount={amount}
        fee={transferFee}
        bank={selectedBank}
      />

      <BetModal 
        isOpen={isBetOpen} 
        onClose={() => setIsBetOpen(false)} 
        user={user}
        onRefresh={onRefresh} 
      />

      <ScanModal 
        isOpen={isScanOpen} 
        onClose={() => setIsScanOpen(false)} 
        user={user}
        onRefresh={onRefresh} 
      />

      <MoreModal 
        isOpen={isMoreOpen} 
        onClose={() => setIsMoreOpen(false)} 
      />

      <LinkExternalCardModal 
        isOpen={isLinkCardOpen} 
        onClose={() => setIsLinkCardOpen(false)} 
        user={user}
        onRefresh={onRefresh} 
      />
      <BVNModal user={user} isOpen={isBVNModalOpen} onClose={() => setIsBVNModalOpen(false)} onRefresh={onRefresh} />
    </div>
  );
}

function InvestModal({ isOpen, onClose, user, onRefresh, investments }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void, investments: any[] }) {
  const [type, setType] = useState("Fixed Deposit");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');

  const investmentOptions = [
    { type: "Fixed Deposit", rate: "12.5% p.a", risk: "Low", icon: <Building2 className="w-5 h-5 text-blue-500" /> },
    { type: "Global Stocks", rate: "Variable", risk: "High", icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
    { type: "Real Estate", rate: "18% p.a", risk: "Medium", icon: <Home className="w-5 h-5 text-amber-500" /> },
    { type: "Mutual Funds", rate: "10% p.a", risk: "Low", icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> },
  ];

  const handleInvest = async () => {
    if (!user) return;
    if (!amount) {
      toast.error("Enter investment amount");
      return;
    }
    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setIsSubmitting(true);
    try {
      await investmentService.invest(user.id, {
        type, 
        amount: numAmount,
        sender: user.accountNumber
      });
      toast.success(`Success! ₦${amount} invested in ${type}`);
      setActiveTab('my');
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Investment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20 overflow-hidden rounded-[2rem]">
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <CardTitle className="mt-2">Viva Invest</CardTitle>
                <CardDescription>Grow your wealth with professional portfolios.</CardDescription>
              </CardHeader>

              <div className="flex border-b mx-6">
                <button 
                  onClick={() => setActiveTab('browse')}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === 'browse' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  Explore
                </button>
                <button 
                  onClick={() => setActiveTab('my')}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === 'my' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  Portfolio ({investments.length})
                </button>
              </div>

              <CardContent className="pt-6 space-y-4">
                {activeTab === 'browse' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-2 gap-3">
                      {investmentOptions.map((opt) => (
                        <button
                          key={opt.type}
                          onClick={() => setType(opt.type)}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            type === opt.type ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' : 'border-primary/10 hover:border-primary/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${type === opt.type ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-600'}`}>
                            {opt.icon}
                          </div>
                          <p className="text-sm font-bold">{opt.type}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-emerald-600 font-bold">{opt.rate}</p>
                            <Badge variant="outline" className={`text-[8px] py-0 px-1 ${
                              opt.risk === 'Low' ? 'text-blue-500 border-blue-200 bg-blue-50' :
                              opt.risk === 'Medium' ? 'text-amber-500 border-amber-200 bg-amber-50' :
                              'text-red-500 border-red-200 bg-red-50'
                            }`}>
                              {opt.risk}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount to Invest (₦)</label>
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none font-bold text-lg" 
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Est. Annual Return</span>
                      <span className="text-emerald-500">₦{(parseFloat(amount || "0") * 0.12).toLocaleString()}</span>
                    </div>

                    <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-lg shadow-primary/20" disabled={isSubmitting || !amount} onClick={handleInvest}>
                      {isSubmitting ? "Processing..." : `Invest in ${type}`}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 animate-in fade-in slide-in-from-left-4">
                    {investments.length === 0 ? (
                      <div className="text-center py-10 space-y-3 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                          <EyeOff className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm italic">You don't have any investments yet.</p>
                      </div>
                    ) : (
                      investments.map((inv, idx) => (
                        <div key={inv.id || idx} className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-sm">{inv.type}</p>
                                <p className="text-[10px] text-muted-foreground">Active since {new Date(inv.timestamp?.seconds * 1000).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-primary">₦{inv.amount.toLocaleString()}</p>
                              <p className="text-[9px] text-emerald-600 font-bold">+2.4% Profit</p>
                            </div>
                          </div>
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

function BetModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void }) {
  const [platform, setPlatform] = useState("SportyBet");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platforms = ["SportyBet", "Bet9ja", "1xBet", "BetKing", "MSport", "22Bet"];

  const handleTopup = async () => {
    if (!user) return;
    if (!customerId || !amount) {
      toast.error("Please fill all fields");
      return;
    }
    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setIsSubmitting(true);
    try {
      await bettingService.topup(user.id, {
        platform,
        amount: numAmount,
        customerId,
        sender: user.accountNumber
      });
      toast.success(`Success! ₦${amount} sent to your ${platform} wallet`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Top-up failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Betting Services</CardTitle>
                  <CardDescription>Instant top-up for your betting wallets.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Platform</label>
                  <select 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none"
                  >
                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">User ID / Customer Code</label>
                  <input 
                    type="text" 
                    value={customerId} 
                    onChange={(e) => setCustomerId(e.target.value)} 
                    placeholder="Enter your user ID" 
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (₦)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none" 
                  />
                </div>
                <Button className="w-full h-12 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white" disabled={isSubmitting} onClick={handleTopup}>
                  {isSubmitting ? "Processing..." : "Top-up Now"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ScanModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void }) {
  const [isScanning, setIsScanning] = useState(true);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(true);
      setMerchant(null);
      setAmount("");
      setIsProcessing(false);
      return;
    }

    // Auto-detect simulation if camera is not available or for demo
    const timer = setTimeout(() => {
      if (isScanning && !merchant) {
         setMerchant("VIVA-7729 (Mainland Hub)");
         setIsScanning(false);
      }
    }, 5000);

    const interval = setInterval(() => {
      if (webcamRef.current && isScanning) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          const image = new Image();
          image.src = imageSrc;
          image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(image, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code) {
                try {
                  const data = JSON.parse(code.data);
                  if (data.type === 'viva_merchant' || data.merchantId) {
                    setMerchant(data.merchantId || data.name || "Unknown Merchant");
                    setIsScanning(false);
                  }
                } catch (e) {
                  // Not a JSON QR or not Viva
                }
              }
            }
          };
        }
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isOpen, isScanning, merchant]);

  const handlePay = async () => {
    if (!user || !amount || !merchant) return;
    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setIsProcessing(true);
    try {
      await scanPayService.pay(user.id, {
        merchantId: merchant,
        amount: numAmount,
        sender: user.accountNumber
      });
      toast.success(`Paid ₦${amount} to ${merchant}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border-none bg-slate-900 text-white overflow-hidden rounded-[2.5rem]">
              <div className="p-8 text-center space-y-6">
                {isScanning ? (
                  <>
                    <div className="relative w-full aspect-square mx-auto border-2 border-primary/50 rounded-3xl flex items-center justify-center overflow-hidden bg-black">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        mirrored={false}
                        screenshotQuality={1}
                        forceScreenshotSourceSize={false}
                        imageSmoothing={true}
                        disablePictureInPicture={true}
                        onUserMedia={() => {}}
                        onUserMediaError={() => {}}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan" style={{ height: '20%', top: '-20%' }} />
                      <div className="z-10 bg-black/40 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                        <QrCode className="w-16 h-16 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Scan Merchant QR</h3>
                      <p className="text-slate-400 text-xs">Point your camera at a Viva Merchant QR code</p>
                    </div>
                    <div className="flex flex-col gap-2">
                       <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={onClose}>Cancel</Button>
                       <p className="text-[10px] text-slate-500 italic">Scanning automatically in 5s for demo...</p>
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Store className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">{merchant}</h3>
                      <p className="text-slate-400 text-sm">Verified Viva Merchant</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Amount to Pay</label>
                       <div className="relative">
                         <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">₦</span>
                         <input 
                          type="number" 
                          autoFocus
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00" 
                          className="w-full bg-transparent text-white text-4xl font-bold text-center outline-none pl-6" 
                         />
                       </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5" onClick={() => setIsScanning(true)}>Rescan</Button>
                      <Button 
                        className="flex-2 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg" 
                        onClick={handlePay}
                        disabled={isProcessing || !amount}
                      >
                        {isProcessing ? "Paying..." : "Pay Now"}
                      </Button>
                    </div>
                    <Button variant="ghost" className="w-full text-slate-400" onClick={onClose}>Cancel</Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MoreModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const extraServices = [
    { icon: <CreditCard className="w-5 h-5 text-pink-500" />, label: "Gift Cards" },
    { icon: <Tv className="w-5 h-5 text-indigo-500" />, label: "Cable TV" },
    { icon: <Layout className="w-5 h-5 text-teal-500" />, label: "Lifestyle" },
    { icon: <Zap className="w-5 h-5 text-yellow-500" />, label: "Electricity" },
    { icon: <Plane className="w-5 h-5 text-blue-500" />, label: "Flights" },
    { icon: <School className="w-5 h-5 text-emerald-500" />, label: "Education" },
    { icon: <Ticket className="w-5 h-5 text-purple-500" />, label: "Events" },
    { icon: <ShoppingBag className="w-5 h-5 text-orange-500" />, label: "Shopping" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border border-primary/20 rounded-[2.5rem]">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle>All Services</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-y-8 gap-x-2">
                  {extraServices.map((service, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => toast.info(`${service.label} integration coming soon!`)}>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform border border-transparent group-hover:border-primary/20">
                        {service.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary transition-colors text-center leading-tight">{service.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function LinkExternalCardModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void }) {
  const [bank, setBank] = useState("First Bank");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLink = async () => {
    if (!user) return;
    if (cardNumber.length < 16 || !expiry || cvv.length < 3) {
      toast.error("Please enter valid card details");
      return;
    }
    setIsSubmitting(true);
    try {
      await cardService.addExternalCard(user.id, {
        bank, 
        type: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard', 
        last4: cardNumber.slice(-4), 
        expiry 
      });
      toast.success(`Successfully linked your ${bank} card`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to link card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Link Bank Card</CardTitle>
                  <CardDescription>Add a card from another bank to fund your Viva account.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Name</label>
                  <select 
                    value={bank} 
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none"
                  >
                    {["First Bank", "GTBank", "Zenith Bank", "Access Bank", "UBA", "Stanbic IBTC", "Kuda", "OPay", "PalmPay"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber} 
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} 
                    placeholder="0000 0000 0000 0000" 
                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none font-mono" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expiry (MM/YY)</label>
                    <input 
                      type="text" 
                      value={expiry} 
                      onChange={(e) => setExpiry(e.target.value.slice(0, 5))} 
                      placeholder="MM/YY" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none font-mono" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CVV</label>
                    <input 
                      type="password" 
                      value={cvv} 
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} 
                      placeholder="***" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none font-mono" 
                    />
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" disabled={isSubmitting} onClick={handleLink}>
                  {isSubmitting ? "Linking..." : "Link Card Securely"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TwoFactorModal({ isOpen, onClose, onVerified }: { isOpen: boolean, onClose: () => void, onVerified: () => void }) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsVerifying(true);
    // Mock verification
    setTimeout(() => {
      if (code === "123456") {
        toast.success("Identity verified");
        setCode("");
        onVerified();
      } else {
        toast.error("Invalid verification code");
      }
      setIsVerifying(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm"
          >
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Verify Your Identity</CardTitle>
                <CardDescription>Enter the 6-digit code sent to your device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-2">
                  <input 
                    type="text" 
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-4xl font-bold tracking-[0.5em] p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Demo mode: Use code <span className="font-bold text-primary">123456</span>
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button 
                    className="flex-1 rounded-xl" 
                    disabled={isVerifying || code.length !== 6}
                    onClick={handleVerify}
                  >
                    {isVerifying ? "Verifying..." : "Verify"}
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

function AirtimeModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void }) {
  const [type, setType] = useState<"airtime" | "data">("airtime");
  const [network, setNetwork] = useState("MTN");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [amount, setAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dataPlans: Record<string, { label: string, price: number, data: string }[]> = {
    "MTN": [
      { label: "100MB / 1 Day", price: 110, data: "100MB" },
      { label: "200MB / 2 Days", price: 230, data: "200MB" },
      { label: "1GB / 30 Days", price: 500, data: "1GB" },
      { label: "5GB / 30 Days", price: 2500, data: "5GB" }
    ],
    "Airtel": [
      { label: "100MB / 1 Day", price: 110, data: "100MB" },
      { label: "200MB / 2 Days", price: 230, data: "200MB" },
      { label: "1GB / 30 Days", price: 500, data: "1GB" },
      { label: "5GB / 30 Days", price: 2500, data: "5GB" }
    ],
    "Glo": [
      { label: "100MB / 1 Day", price: 110, data: "100MB" },
      { label: "200MB / 2 Days", price: 230, data: "200MB" },
      { label: "1GB / 30 Days", price: 500, data: "1GB" },
      { label: "5GB / 30 Days", price: 2500, data: "5GB" }
    ],
    "9mobile": [
      { label: "100MB / 1 Day", price: 110, data: "100MB" },
      { label: "200MB / 2 Days", price: 230, data: "200MB" },
      { label: "1GB / 30 Days", price: 500, data: "1GB" },
      { label: "5GB / 30 Days", price: 2500, data: "5GB" }
    ]
  };

  const handleRecharge = async () => {
    if (!user) return;
    const finalAmount = type === 'data' ? selectedPlan?.price : parseFloat(amount);
    if (!phoneNumber || !finalAmount) {
      toast.error("Please fill all fields");
      return;
    }
    if (finalAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setIsSubmitting(true);
    try {
      await rechargeService.recharge(user.id, {
        type, 
        network, 
        amount: finalAmount, 
        phoneNumber,
        sender: user.accountNumber,
        receiver: `${network} (${phoneNumber})`,
        plan: type === 'data' ? selectedPlan?.label : null
      });
      toast.success(`${type === 'airtime' ? 'Airtime' : 'Data (' + selectedPlan.label + ')'} recharge successful!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Recharge failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Buy Airtime & Data</CardTitle>
                  <CardDescription>Top up your line instantly.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={type} onValueChange={(v) => {
                  setType(v as "airtime" | "data");
                  setSelectedPlan(null);
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                    <TabsTrigger value="airtime" className="rounded-lg">Airtime</TabsTrigger>
                    <TabsTrigger value="data" className="rounded-lg">Data</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-4 gap-2 py-2">
                  {["MTN", "Airtel", "Glo", "9mobile"].map((net) => (
                    <button
                      key={net}
                      onClick={() => {
                        setNetwork(net);
                        setSelectedPlan(null);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        network === net ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-primary/10'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      placeholder="08012345678" 
                      className="w-full pl-10 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>
                </div>

                {type === 'airtime' ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-medium">Amount (₦)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="w-full pl-10 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/20" 
                      />
                    </div>
                    <div className="flex gap-2">
                      {[110, 230, 500, 1000].map((v) => (
                        <button 
                          key={v} 
                          onClick={() => setAmount(v.toString())}
                          className="flex-1 py-1.5 rounded-lg border text-[10px] font-bold hover:bg-primary hover:text-white hover:border-primary transition-all"
                        >
                          ₦{v}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-medium">Select Data Plan</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {dataPlans[network].map((plan, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                            selectedPlan?.label === plan.label ? 'bg-primary/5 border-primary shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-primary/10'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">{plan.label}</p>
                            <p className="text-[10px] text-muted-foreground">{plan.data} Data Allowance</p>
                          </div>
                          <p className="font-bold text-primary">₦{plan.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting || (type === 'data' && !selectedPlan) || (type === 'airtime' && !amount)} onClick={handleRecharge}>
                    {isSubmitting ? "Processing..." : `Recharge ${type === 'data' ? '₦' + selectedPlan?.price?.toLocaleString() : ''}`}
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

function ActionItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group transition-transform active:scale-95">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </button>
  );
}

function BillsModal({ isOpen, onClose, user, onRefresh, recurringPayments, transactions }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void, recurringPayments: any[], transactions: Transaction[] }) {
  const [biller, setBiller] = useState("IKEDC (Electric)");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pay' | 'scheduled' | 'history'>('pay');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [payLaterDate, setPayLaterDate] = useState("");
  const [isPayLater, setIsPayLater] = useState(false);

  const billHistory = transactions.filter(tx => tx.type === 'bill');

  const handlePay = async () => {
    if (!user) return;
    if (!meterNumber || !amount) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isRecurring || isPayLater) {
        const nextDate = isPayLater ? new Date(payLaterDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await recurringPaymentService.addRecurringPayment(user.id, {
          name: biller,
          amount: parseFloat(amount),
          category: "Utility",
          frequency: isPayLater ? "once" : frequency,
          nextPaymentDate: nextDate,
          type: isPayLater ? "pay_later" : "bill"
        });
        toast.success(isPayLater ? "Payment scheduled!" : "Recurring payment created!");
      } else {
        await transactionService.addTransaction(user.id, {
          type: 'bill',
          amount: parseFloat(amount),
          receiver: biller,
          sender: user.accountNumber,
          bank: 'Viva',
          status: 'success'
        });
        toast.success("Bill paid successfully!");
      }
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRecurring = async (id: string) => {
    if (!user) return;
    try {
      await recurringPaymentService.deleteRecurringPayment(user.id, id);
      toast.success("Schedule cancelled");
    } catch (err) {
      toast.error("Failed to cancel");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border border-primary/20 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle>Utility Payments</CardTitle>
                  <CardDescription>Pay bills, schedule or view history.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <div className="flex border-b overflow-x-auto scrollbar-hide">
                <button 
                  onClick={() => setActiveTab('pay')}
                  className={`flex-1 py-3 px-4 text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'pay' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  Pay Now
                </button>
                <button 
                  onClick={() => setActiveTab('scheduled')}
                  className={`flex-1 py-3 px-4 text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'scheduled' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  Scheduled ({recurringPayments.filter(p => p.status === 'active').length})
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 text-xs font-bold transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  History
                </button>
              </div>
              <CardContent className="p-6 space-y-4">
                {activeTab === 'pay' ? (
                  <>
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      {user && user.tier < 2 && user.role !== 'admin' && (
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-sm text-orange-700">
                          <ShieldAlert className="w-5 h-5 shrink-0" />
                          <p>Bill payment is only available for **Tier 2** accounts and above.</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Biller</label>
                        <select value={biller} onChange={(e) => setBiller(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="IKEDC (Electric)">IKEDC (Electric)</option>
                          <option value="EKEDC (Electric)">EKEDC (Electric)</option>
                          <option value="DSTV Subscription">DSTV Subscription</option>
                          <option value="Netflix Premium">Netflix Premium</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Account/Meter Number</label>
                        <input type="text" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} placeholder="042XXXXXXXX" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Amount (₦)</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
                      </div>

                      <div className="space-y-2">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-muted space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <History className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-slate-700">Recurring Payment</span>
                            </div>
                            <button 
                              onClick={() => {
                                setIsRecurring(!isRecurring);
                                if (!isRecurring) setIsPayLater(false);
                              }}
                              className={`w-10 h-5 rounded-full transition-colors relative ${isRecurring ? 'bg-primary' : 'bg-slate-200'}`}
                            >
                              <motion.div 
                                animate={{ x: isRecurring ? 22 : 2 }}
                                className="absolute top-0.5 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                              />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-bold text-slate-700">Pay Later (Schedule)</span>
                            </div>
                            <button 
                              onClick={() => {
                                setIsPayLater(!isPayLater);
                                if (!isPayLater) setIsRecurring(false);
                              }}
                              className={`w-10 h-5 rounded-full transition-colors relative ${isPayLater ? 'bg-orange-500' : 'bg-slate-200'}`}
                            >
                              <motion.div 
                                animate={{ x: isPayLater ? 22 : 2 }}
                                className="absolute top-0.5 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                              />
                            </button>
                          </div>

                          <AnimatePresence>
                            {isRecurring && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-2 pt-2 border-t"
                              >
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Frequency</label>
                                <div className="flex gap-2">
                                  {['weekly', 'monthly', 'yearly'].map(f => (
                                    <button key={f} onClick={() => setFrequency(f)} className={`flex-1 py-2 rounded-lg border text-[10px] font-bold capitalize transition-all ${frequency === f ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-slate-50'}`}>{f}</button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                            {isPayLater && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-2 pt-2 border-t"
                              >
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pick Date</label>
                                <input 
                                  type="date" 
                                  value={payLaterDate} 
                                  onChange={(e) => setPayLaterDate(e.target.value)} 
                                  className="w-full p-2 border rounded-lg text-xs"
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-3">
                        <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                        <Button 
                          className="flex-1 rounded-xl shadow-lg shadow-primary/20 h-12" 
                          disabled={isSubmitting || (user && user.tier < 2 && user.role !== 'admin')} 
                          onClick={handlePay}
                        >
                          {isSubmitting ? "Processing..." : isRecurring ? "Set Recurring" : isPayLater ? "Schedule Later" : "Pay Bill Now"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : activeTab === 'scheduled' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 max-h-96 overflow-y-auto pr-2">
                    {recurringPayments.filter(p => p.status === 'active').length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                          <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-muted-foreground">No active payment schedules.</p>
                      </div>
                    ) : (
                      recurringPayments.filter(p => p.status === 'active').map(payment => (
                        <div key={payment.id} className="p-4 rounded-2xl border border-muted bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between group hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payment.type === 'pay_later' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                              {payment.type === 'pay_later' ? <Calendar className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{payment.name}</p>
                              <p className="text-[10px] text-muted-foreground">₦{payment.amount.toLocaleString()} • {payment.frequency === 'once' ? 'One-time' : payment.frequency}</p>
                              <p className="text-[10px] text-primary font-medium">Due: {new Date(payment.nextPaymentDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button onClick={() => cancelRecurring(payment.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 max-h-96 overflow-y-auto pr-2">
                    {billHistory.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                          <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-muted-foreground">No past bill payments.</p>
                      </div>
                    ) : (
                      billHistory.map(tx => (
                        <div key={tx.id} className="p-4 rounded-2xl border border-muted flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                              <ReceiptText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{tx.receiver}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-red-500">-₦{tx.amount.toLocaleString()}</p>
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

function UpgradeTierModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upgradeToTier = async (targetTier: number) => {
    if (!user) return;
    if (user.tier >= targetTier) {
      toast.info("You are already at or above this tier.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newLimit = getEffectiveLimit(targetTier, !!user.isVerified);
      await userService.updateProfile(user.id, {
        tier: targetTier,
        transferLimit: newLimit
      });
      toast.success(`Upgraded to Tier ${targetTier}!`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error("Failed to upgrade tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg"
          >
            <Card className="shadow-2xl border border-primary/20 overflow-hidden rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5 pb-6">
                <div>
                  <CardTitle className="text-xl">Account Tier Upgrade</CardTitle>
                  <CardDescription>Increase your limits and unlock features.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {Object.entries(TIER_LIMITS).map(([tier, info]: [any, any]) => (
                    <div 
                      key={tier} 
                      className={`p-6 transition-colors ${Number(tier) === user?.tier ? 'bg-primary/5' : 'bg-white'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold">Tier {tier}: {info.label}</h4>
                            {Number(tier) === user?.tier && (
                              <Badge className="bg-primary text-white border-none py-0.5 px-2 text-[10px]">Current</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requires: {info.requirements.includes('BVN') && !user?.isVerified ? (
                              <button 
                                onClick={() => {
                                  onClose();
                                  // This would need a way to open BVN modal, 
                                  // but since they are siblings or at App level, 
                                  // it might be tricky without lifting state or using a global store.
                                  // For now, I'll assume they can see it in Profile or Dashboard.
                                  toast.info("Go to Profile to verify BVN");
                                }}
                                className="text-primary font-bold hover:underline"
                              >
                                {info.requirements}
                              </button>
                            ) : info.requirements}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">₦{info.verified.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Daily Limit (Verified)</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          disabled={isSubmitting || Number(tier) <= (user?.tier || 1)}
                          onClick={() => upgradeToTier(Number(tier))}
                          className={`w-full rounded-xl h-10 text-xs font-bold ${Number(tier) <= (user?.tier || 1) ? 'bg-slate-100 text-slate-400' : 'shadow-lg shadow-primary/10'}`}
                        >
                          {Number(tier) === user?.tier ? "Current Tier" : Number(tier) < (user?.tier || 1) ? "Completed" : `Upgrade to Tier ${tier}`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-slate-50 border-t flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-[10px] text-muted-foreground font-medium">
                  Upgrading may require additional documents. Once submitted, our team will review your request within 24 hours.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function EscrowModal({ isOpen, onClose, user, onRefresh, escrows }: { isOpen: boolean, onClose: () => void, user: User | null, onRefresh: () => void, escrows: any[] }) {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'active'>('create');

  const handleCreateEscrow = async () => {
    if (!user) return;
    if (!receiver || !amount) {
      toast.error("Please fill in recipient and amount");
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsSubmitting(true);
    try {
      await escrowService.createEscrow(user.id, {
        sender: user.accountNumber,
        receiver, 
        amount: numAmount,
        reason
      });
      toast.success(`₦${amount} held in escrow for ${receiver}`);
      onClose();
      setReceiver("");
      setAmount("");
      setReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create escrow");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await escrowService.releaseEscrow(user.id, escrowId);
      toast.success("Funds released successfully!");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to release funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeEscrows = escrows.filter(e => e.status === 'held');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm"
          >
            <Card className="shadow-2xl border border-primary/20 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <CardTitle className="mt-2 text-2xl font-black">Escrow Protect</CardTitle>
                <CardDescription>Secure payments until goods or services are delivered.</CardDescription>
              </CardHeader>
              
              <div className="flex border-b mx-6">
                <button 
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === 'create' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  Create New
                </button>
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${activeTab === 'active' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                >
                  Active ({activeEscrows.length})
                </button>
              </div>

              <CardContent className="pt-6 space-y-4">
                {activeTab === 'create' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipient Account</label>
                      <input 
                        type="text" 
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="Recipient Account Number" 
                        className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (₦)</label>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00" 
                        className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Transaction Reason</label>
                      <input 
                        type="text" 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Graphic Design Work" 
                        className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      />
                    </div>
                    <Button 
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-500/20" 
                      disabled={isSubmitting}
                      onClick={handleCreateEscrow}
                    >
                      {isSubmitting ? "Holding Funds..." : "Secure Transition"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 animate-in fade-in slide-in-from-left-4">
                    {activeEscrows.length === 0 ? (
                      <div className="text-center py-10 space-y-3 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                          <EyeOff className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm">No active escrows found</p>
                      </div>
                    ) : (
                      activeEscrows.map((e, idx) => (
                        <div key={e.id || idx} className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <p className="font-bold text-sm">To: {e.receiver}</p>
                              <p className="text-[10px] text-muted-foreground">{e.reason || "No reason"}</p>
                            </div>
                            <p className="font-black text-indigo-600">₦{e.amount.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 h-5 text-[8px] uppercase tracking-tighter">FUNDS HELD</Badge>
                          </div>
                          <Button 
                            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold" 
                            disabled={isSubmitting}
                            onClick={() => handleReleaseEscrow(e.id)}
                          >
                            Release Funds to Recipient
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

function TierCard({ tier, limit, features = [], active, current, onUpgrade }: { tier: number, limit: string, features?: string[], active: boolean, current: number, onUpgrade: () => void }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-primary/20 bg-white shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold flex items-center gap-2">
            Tier {tier}
            {active && <Badge className="h-4 text-[8px]">CURRENT</Badge>}
          </h4>
          <p className="text-xl font-black text-primary">₦{limit} <span className="text-[10px] text-muted-foreground font-normal">limit</span></p>
        </div>
        {!active && tier > current && (
          <Button size="sm" className="rounded-lg text-[10px] h-7" onClick={onUpgrade}>Upgrade</Button>
        )}
      </div>
      {features.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {features.map((f, i) => (
            <span key={i} className="text-[9px] bg-white px-2 py-0.5 rounded-full border border-primary/10 text-primary font-medium">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceIcon({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={onClick || (() => toast.info(`${label} service coming soon`))}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white shadow-sm border border-primary/20 flex items-center justify-center hover:shadow-md transition-shadow">
        {icon}
      </div>
      <span className="text-[10px] md:text-xs font-medium text-muted-foreground">{label}</span>
    </motion.button>
  );
}

function LoginScreen({ onLogin, onGoToRegister, user }: { onLogin: () => void, onGoToRegister: () => void, user: User | null }) {
  const [email, setEmail] = useState(() => localStorage.getItem("lastLoginEmail") || "demo@viva.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricPhase, setBiometricPhase] = useState<"idle" | "scanning" | "verifying" | "success" | "failed">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async () => {
    if (!password) {
      setError("Please enter your password");
      toast.error("Required field missing");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("lastLoginEmail", email);
      toast.success("Welcome back!");
      onLogin();
    } catch (err: any) {
      let msg = "Invalid email or password.";
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      setError(msg);
      toast.error("Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsBiometricScanning(true);
    setBiometricPhase("scanning");
    
    // Phase 1: Scanning
    await new Promise(r => setTimeout(r, 1500));
    setBiometricPhase("verifying");
    
    // Phase 2: Verifying
    await new Promise(r => setTimeout(r, 1000));
    
    if (Math.random() > 0.05) { // 95% success rate for simulation
      setBiometricPhase("success");
      toast.success("Identity Confirmed");
      setTimeout(() => {
        setIsBiometricScanning(false);
        onLogin();
      }, 500);
    } else {
      setBiometricPhase("failed");
      toast.error("Biometric mismatch. Please try again.");
      setTimeout(() => {
        setIsBiometricScanning(false);
        setBiometricPhase("idle");
      }, 1500);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-[var(--viva-gradient)] overflow-hidden relative gap-6">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="flex flex-col items-center gap-2 mt-4 z-10 w-full max-w-sm text-foreground">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-2"
        >
          <span className="text-3xl font-black text-white">V</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent"
        >
          Welcome Back
        </motion.h1>
        <p className="text-muted-foreground text-sm font-medium">Please enter your password to continue.</p>
        <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-primary/20">
          <UserIcon className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-slate-600">{email}</span>
          <button 
            onClick={() => {
              const newEmail = prompt("Enter email address:");
              if (newEmail) setEmail(newEmail);
            }}
            className="text-[10px] text-primary hover:underline font-bold ml-1"
          >
            Change
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 z-10">
        <div className="space-y-3">
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <Lock className="absolute left-4 top-4.5 w-5 h-5 text-slate-500" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? "true" : "false"}
              placeholder="Enter your security PIN" 
              className={`w-full p-4 pl-12 pr-12 rounded-2xl bg-white/80 backdrop-blur-md border ${error ? 'border-destructive focus-visible:ring-destructive shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-primary/30 focus-visible:ring-primary'} text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all text-center`}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4.5 text-slate-500 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </motion.div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-[10px] font-bold text-center uppercase tracking-widest"
            >
              {error}
            </motion.p>
          )}
          <Button 
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 mt-4 bg-gradient-to-r from-emerald-600 to-purple-600 border-none hover:opacity-90"
            disabled={isSubmitting || isBiometricScanning || !password}
            onClick={handlePasswordLogin}
          >
            {isSubmitting ? "Authenticating..." : "Login"}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Or login with</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            disabled={isBiometricScanning}
            onClick={handleBiometricLogin}
            className="relative w-24 h-24 flex items-center justify-center group"
          >
            <AnimatePresence>
              {(isBiometricScanning || biometricPhase === "scanning") && (
                <>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.6, opacity: 0.4 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-primary/20 rounded-full"
                  />
                  <motion.div 
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-primary/60 z-20 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                </>
              )}
            </AnimatePresence>
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              biometricPhase === "success" ? 'bg-emerald-500 text-white shadow-emerald-500/50' :
              biometricPhase === "failed" ? 'bg-red-500 text-white shadow-red-500/50' :
              isBiometricScanning ? 'bg-primary text-white shadow-primary/50' : 
              'bg-white/5 text-primary hover:bg-white/10'
            } shadow-2xl relative overflow-hidden`}>
              {biometricPhase === "success" ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : biometricPhase === "failed" ? (
                <AlertCircle className="w-10 h-10" />
              ) : (
                <Fingerprint className={`w-10 h-10 transition-transform ${isBiometricScanning ? 'scale-110' : ''}`} />
              )}
            </div>
          </motion.button>
          
          <p className="text-sm text-slate-500 transition-colors">
            {biometricPhase === "idle" && <>Touch sensor for <span className="text-primary font-bold">Fingerprint</span></>}
            {biometricPhase === "scanning" && <span className="text-primary font-bold animate-pulse">Scanning...</span>}
            {biometricPhase === "verifying" && <span className="text-primary font-bold animate-pulse">Verifying...</span>}
            {biometricPhase === "success" && <span className="text-emerald-400 font-bold">Authenticated</span>}
            {biometricPhase === "failed" && <span className="text-red-400 font-bold">Try Again</span>}
          </p>
        </div>
      </div>

      <div className="mb-4 z-10 flex flex-col items-center gap-1">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Secured by Viva Guard</p>
        <div className="flex gap-4">
          <button className="text-slate-500 text-[10px] hover:text-primary transition-colors">Forgot Password?</button>
          <button onClick={onGoToRegister} className="text-slate-500 text-[10px] hover:text-primary transition-colors">Register Account</button>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <motion.button 
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-primary/30 shadow-sm hover:shadow-md transition-all gap-3"
    >
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-${color.split('-')[1]}-500/20`}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </motion.button>
  );
}

function SecurityAlertsModal({ isOpen, onClose, alerts }: { isOpen: boolean, onClose: () => void, alerts: SecurityAlert[] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg">
            <Card className="shadow-2xl border border-primary/20 max-h-[80vh] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-primary" />
                    Security Alerts
                  </CardTitle>
                  <CardDescription>Stay informed about suspicious account activity.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>No security alerts found.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-600' : 
                          alert.severity === 'medium' ? 'bg-orange-100 text-orange-600' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{alert.title}</h4>
                            {alert.severity === 'high' && <Badge variant="destructive" className="text-[8px] h-4">CRITICAL</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{alert.message}</p>
                          
                          {(alert.ip || alert.device) && (
                            <div className="flex flex-wrap gap-3 py-2">
                              {alert.ip && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-primary/10">
                                  <MapPin className="w-3 h-3" />
                                  {alert.ip}
                                </div>
                              )}
                              {alert.device && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-primary/10">
                                  <Monitor className="w-3 h-3" />
                                  {alert.device}
                                </div>
                              )}
                            </div>
                          )}

                          {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                            <div className="pt-2">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Recommended Actions
                              </p>
                              <div className="space-y-1.5">
                                {alert.recommendedActions.map((action, idx) => (
                                  <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-primary/5 p-2 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                                    <span className="text-xs font-medium text-slate-600">{action}</span>
                                    <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <p className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded-full font-medium mt-2">
                            {new Date(alert.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t bg-slate-50 dark:bg-slate-950 rounded-b-3xl">
                <Button className="w-full rounded-xl" onClick={onClose}>Dismiss All</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function RegisterScreen({ onRegister, onBackToLogin }: { onRegister: () => void, onBackToLogin: () => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);

  useEffect(() => {
    if (name.length > 2) {
      const base = name.toLowerCase().replace(/\s+/g, '');
      const suggestions = [
        base,
        `${base}${Math.floor(100 + Math.random() * 899)}`,
        `${base}_viva`,
        `viva_${base}`
      ];
      setSuggestedUsernames(suggestions);
    } else {
      setSuggestedUsernames([]);
    }
  }, [name]);

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  const strengthCount = [hasUpperCase, hasLowerCase, hasSpecialChar, isLongEnough].filter(Boolean).length;
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  const isPasswordValid = hasUpperCase && hasLowerCase && hasSpecialChar && isLongEnough;
  const isPhoneValid = phoneNumber ? /^(0\d{10})$/.test(phoneNumber) : true;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !username) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements.");
      return;
    }

    if (!isPhoneValid) {
      toast.error("Please enter a valid 11-digit phone number starting with 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await userService.createUserProfile(user.uid, {
        name,
        email,
        username,
        phoneNumber,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      });

      toast.success("Account created! Welcome to Viva.");
      onRegister();
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-[var(--viva-gradient)] overflow-hidden relative gap-6 text-foreground">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="flex flex-col items-center gap-2 z-10 w-full max-w-sm mt-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-2"
        >
          <span className="text-3xl font-black text-white">V</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-black tracking-tighter bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent"
        >
          Join Viva
        </motion.h1>
        <p className="text-muted-foreground text-sm font-medium text-center">Open your account in minutes.</p>
      </div>

      <div className="w-full max-w-sm z-10">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={name.length > 0 && name.length < 3 ? "true" : "false"}
              placeholder="Full Name" 
              className="w-full p-4 pl-12 rounded-2xl bg-white border border-primary/30 focus-visible:ring-primary aria-invalid:border-destructive text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all"
            />
          </div>
          <div className="relative">
            <LayoutGrid className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              aria-invalid={username.length > 0 && username.length < 3 ? "true" : "false"}
              placeholder="Username" 
              className="w-full p-4 pl-12 rounded-2xl bg-white border border-primary/30 focus-visible:ring-primary aria-invalid:border-destructive text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all"
            />
          </div>
          
          {suggestedUsernames.length > 0 && !username && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-2"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Suggested Usernames</p>
              <div className="flex flex-wrap gap-2">
                {suggestedUsernames.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setUsername(suggestion)}
                    className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-all font-medium"
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={email.length > 0 && !email.includes('@') ? "true" : "false"}
              placeholder="Email Address" 
              className="w-full p-4 pl-12 rounded-2xl bg-white border border-primary/30 focus-visible:ring-primary aria-invalid:border-destructive text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              aria-invalid={phoneNumber.length > 0 && !isPhoneValid ? "true" : "false"}
              placeholder="Phone Number (11 digits)" 
              className="w-full p-4 pl-12 rounded-2xl bg-white border border-primary/30 focus-visible:ring-primary aria-invalid:border-destructive text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={password.length > 0 && !isPasswordValid ? "true" : "false"}
              placeholder="Create Password" 
              className="w-full p-4 pl-12 pr-12 rounded-2xl bg-white border border-primary/30 focus-visible:ring-primary aria-invalid:border-destructive text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all text-center font-mono"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="bg-white/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Security Level</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${password.length > 0 ? strengthColors[strengthCount].replace('bg-', 'text-') : 'text-slate-400'}`}>
                {password.length > 0 ? strengthLabels[strengthCount] : "None"}
              </span>
            </div>
            
            <div className="flex gap-1 h-1.5">
              {[0, 1, 2, 3, 4].map((step) => (
                <div 
                  key={step}
                  className={`h-full flex-1 rounded-full transition-all duration-500 ${
                    step <= strengthCount && password.length > 0 ? strengthColors[strengthCount] : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/5 mt-2">
              <div className={`flex items-center gap-1.5 text-[9px] font-bold transition-colors ${isLongEnough ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-1 h-1 rounded-full ${isLongEnough ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                MIN 8 CHARS
              </div>
              <div className={`flex items-center gap-1.5 text-[9px] font-bold transition-colors ${hasUpperCase ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-1 h-1 rounded-full ${hasUpperCase ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                UPPERCASE
              </div>
              <div className={`flex items-center gap-1.5 text-[9px] font-bold transition-colors ${hasLowerCase ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-1 h-1 rounded-full ${hasLowerCase ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                LOWERCASE
              </div>
              <div className={`flex items-center gap-1.5 text-[9px] font-bold transition-colors ${hasSpecialChar ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-1 h-1 rounded-full ${hasSpecialChar ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                SPECIAL CHAR
              </div>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 bg-gradient-to-r from-emerald-600 to-purple-600 border-none hover:opacity-90"
            disabled={isSubmitting || !isPasswordValid}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>

      <div className="z-10 flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-xs">By joining, you agree to our Terms & Privacy</p>
        <button 
          onClick={onBackToLogin}
          className="text-primary font-bold text-sm hover:underline"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );
}

function SecurityCenterModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg">
            <Card className="shadow-2xl border border-primary/20 max-h-[85vh] flex flex-col overflow-hidden rounded-[2.5rem]">
              <CardHeader className="bg-primary/5 pb-8 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      Security Center
                    </CardTitle>
                    <CardDescription className="pt-2">Protect your account and get help when you need it.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-primary/10">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Customer Support</h3>
                  <div className="space-y-3">
                    <a href="tel:08183793358" className="block p-4 rounded-2xl bg-secondary/30 border border-muted hover:border-primary/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Phone className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-foreground">Call Customer Care</p>
                          <p className="text-sm text-muted-foreground">08183793358, 07041754159</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </a>
                    
                    <a href="tel:08106202283" className="block p-4 rounded-2xl bg-secondary/30 border border-muted hover:border-primary/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-foreground">Fraud Hotline</p>
                          <p className="text-sm text-muted-foreground">08106202283</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </a>
                    
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-muted hover:border-primary/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold">Email Support</p>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <a href="mailto:idemudiawisdom7@gmail.com" className="hover:text-primary block">idemudiawisdom7@gmail.com</a>
                            <a href="mailto:wisdomoas@yahoo.com" className="hover:text-primary block">wisdomoas@yahoo.com</a>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-muted hover:bg-slate-100 hover:border-primary/30 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <X className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Freeze Card</span>
                    </button>
                    <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-muted hover:bg-slate-100 hover:border-primary/30 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Update PIN</span>
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Your account is safe</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">We use bank-grade security to protect your funds and personal data.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-secondary/20 p-4 flex justify-center border-t">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Version 2.4.0 • Secured by Viva Shield</p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function WithdrawModal({ isOpen, onClose, user, recipientAccounts, onRefresh }: { isOpen: boolean, onClose: () => void, user: User | null, recipientAccounts: any[], onRefresh: () => void }) {
  const [selectedAccount, setSelectedAccount] = useState<any>(recipientAccounts[0] || null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recipientAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(recipientAccounts[0]);
    }
  }, [recipientAccounts, selectedAccount]);

  const handleWithdraw = async () => {
    if (!user || !selectedAccount || !amount) {
      toast.error("Please select an account and enter an amount");
      return;
    }
    const numAmount = parseFloat(amount);
    if (numAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setIsSubmitting(true);
    try {
      await transactionService.addTransaction(user.id, {
        type: 'withdrawal',
        amount: numAmount,
        receiver: `${selectedAccount.bankName} (${selectedAccount.accountNumber})`,
        sender: user.accountNumber,
        bank: selectedAccount.bankName,
        status: 'success'
      });
      toast.success(`Successfully withdrawn ₦${amount} to ${selectedAccount.bankName}`);
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
      <Card className="border border-primary/30 shadow-2xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>Move money to your external bank account.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
             <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Destination</label>
             {recipientAccounts.length === 0 ? (
               <div className="p-6 rounded-2xl border bg-slate-50 dark:bg-slate-950 text-center space-y-3">
                 <p className="text-sm text-muted-foreground">No linked accounts found.</p>
                 <Button variant="outline" size="sm" onClick={() => toast.info("Add account feature coming soon")}>Add Account</Button>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-2">
                 {recipientAccounts.map((acc, idx) => (
                   <button 
                    key={acc.id || idx}
                    onClick={() => setSelectedAccount(acc)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedAccount?.id === acc.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-primary/10 hover:border-primary/30'
                    }`}
                   >
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedAccount?.id === acc.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{acc.bankName}</p>
                          <p className="text-[10px] text-muted-foreground">{acc.accountName} • {acc.accountNumber.slice(-4)}</p>
                        </div>
                     </div>
                     {selectedAccount?.id === acc.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="space-y-2 text-center py-4">
            <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₦</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full h-16 outline-none text-4xl font-black bg-transparent text-center pl-6" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Available: ₦{user?.balance.toLocaleString()}</p>
          </div>

          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" 
            disabled={isSubmitting || !selectedAccount || !amount}
            onClick={handleWithdraw}
          >
            {isSubmitting ? "Processing..." : "Withdraw Now"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default App;
