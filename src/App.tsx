import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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
  ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  email: string;
  balance: number;
  riskLevel: string;
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, txRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/transactions")
      ]);
      const userData = await userRes.json();
      const txData = await txRes.json();
      setUser(userData);
      setTransactions(txData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-primary font-bold text-2xl"
      >
        FinPulse
      </motion.div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-foreground font-sans selection:bg-primary/10">
        <Toaster position="top-center" />
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                F
              </div>
              <span className="font-bold text-xl tracking-tight">FinPulse</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
              <a href="#" className="hover:text-primary transition-colors">Payments</a>
              <a href="#" className="hover:text-primary transition-colors">Escrow</a>
              <a href="#" className="hover:text-primary transition-colors">Cards</a>
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
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border">
                <UserIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8 max-w-7xl pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} transactions={transactions} onRefresh={fetchData} searchQuery={searchQuery} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/cards" element={<CardsView />} />
          </Routes>
        </main>

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
              <UserIcon className="w-6 h-6" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </Router>
  );
}

function CardsView() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Cards</h1>
        <Button className="rounded-full">
          <Plus className="w-4 h-4 mr-2" /> New Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <VirtualCard 
          type="Visa" 
          number="4290" 
          name="WISDOM IDEMUDIA" 
          expiry="08/27" 
          color="bg-slate-900" 
        />
        <VirtualCard 
          type="Mastercard" 
          number="8812" 
          name="WISDOM IDEMUDIA" 
          expiry="12/26" 
          color="bg-gradient-to-br from-purple-600 to-blue-600" 
        />
        <div className="border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer group">
          <Plus className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
          <p className="font-medium">Add New Virtual Card</p>
        </div>
      </div>
    </motion.div>
  );
}

function VirtualCard({ type, number, name, expiry, color }: { type: string, number: string, name: string, expiry: string, color: string }) {
  return (
    <Card className={`${color} text-white border-none relative overflow-hidden h-52 group cursor-pointer shadow-xl`}>
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
        <CreditCard className="w-24 h-24" />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="bg-white/10 text-white border-none">{type}</Badge>
          <div className="w-10 h-6 bg-yellow-500/80 rounded-sm" />
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

function Profile({ user }: { user: User | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl">
          <UserIcon className="w-12 h-12 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Wisdom Idemudia</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
            Verified Account
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        <ProfileItem icon={<Settings className="w-5 h-5" />} label="Account Settings" />
        <ProfileItem icon={<Lock className="w-5 h-5" />} label="Security & Privacy" />
        <ProfileItem icon={<Bell className="w-5 h-5" />} label="Notifications" />
        <ProfileItem icon={<ShieldCheck className="w-5 h-5" />} label="Verification Status" />
        <div className="pt-4">
          <Button variant="destructive" className="w-full rounded-2xl h-12 gap-2">
            <LogOut className="w-5 h-5" /> Log Out
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center justify-between p-4 rounded-2xl bg-background border hover:bg-slate-50 transition-colors group">
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

function Dashboard({ user, transactions, onRefresh, searchQuery }: { user: User | null, transactions: Transaction[], onRefresh: () => void, searchQuery: string }) {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isEscrowOpen, setIsEscrowOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver: recipient, amount: parseFloat(amount) })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`₦${amount} sent to ${recipient}`);
        setIsTransferOpen(false);
        setRecipient("");
        setAmount("");
        onRefresh();
      } else {
        toast.error(data.error || "Transfer failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "External Bank", amount: parseFloat(amount) })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`₦${amount} received successfully!`);
        setIsReceiveOpen(false);
        setAmount("");
        onRefresh();
      } else {
        toast.error(data.error || "Failed to receive money");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscrow = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver: recipient, amount: parseFloat(amount) })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Funds held in Escrow!");
        setIsEscrowOpen(false);
        setRecipient("");
        setAmount("");
        onRefresh();
      } else {
        toast.error(data.error || "Escrow failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back,</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsTransferOpen(true)} className="rounded-full px-6 shadow-lg shadow-primary/20">
            <Send className="w-4 h-4 mr-2" /> Send
          </Button>
          <Button variant="outline" onClick={() => setIsReceiveOpen(true)} className="rounded-full px-6">
            <ArrowDown className="w-4 h-4 mr-2" /> Receive
          </Button>
          <Button variant="outline" className="rounded-full px-6 hidden md:flex" onClick={() => setIsEscrowOpen(true)}>
            <ShieldCheck className="w-4 h-4 mr-2" /> Escrow
          </Button>
        </div>
      </header>

      {/* OPay/PalmPay Style Quick Services */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        <ServiceIcon icon={<Smartphone className="w-6 h-6 text-blue-500" />} label="Airtime" />
        <ServiceIcon icon={<Globe className="w-6 h-6 text-emerald-500" />} label="Data" />
        <ServiceIcon icon={<Building2 className="w-6 h-6 text-orange-500" />} label="Bills" />
        <ServiceIcon icon={<Gamepad2 className="w-6 h-6 text-purple-500" />} label="Betting" />
        <ServiceIcon icon={<QrCode className="w-6 h-6 text-slate-700" />} label="Scan" />
        <ServiceIcon icon={<TrendingUp className="w-6 h-6 text-red-500" />} label="Invest" />
        <ServiceIcon icon={<ShieldCheck className="w-6 h-6 text-indigo-500" />} label="Escrow" />
        <ServiceIcon icon={<Plus className="w-6 h-6 text-slate-400" />} label="More" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Balance & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Balance Card */}
          <Card className="bg-primary text-primary-foreground overflow-hidden relative border-none shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>
            <CardHeader>
              <CardDescription className="text-primary-foreground/70">Total Balance</CardDescription>
              <CardTitle className="text-5xl font-bold tracking-tighter">
                ₦{user?.balance.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-emerald-300 text-sm font-medium bg-emerald-500/20 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" /> +12.5%
                </div>
                <span className="text-primary-foreground/60 text-sm">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Chart */}
          <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm">
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
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
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
              <Card className="bg-slate-900 text-white border-none relative overflow-hidden h-48 group cursor-pointer">
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
              
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-none relative overflow-hidden h-48 group cursor-pointer">
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
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={<CreditCard className="w-5 h-5" />} label="Cards" color="bg-blue-500" />
            <QuickAction icon={<ShieldCheck className="w-5 h-5" />} label="Escrow" color="bg-purple-500" />
            <QuickAction icon={<ArrowDownLeft className="w-5 h-5" />} label="Withdraw" color="bg-orange-500" />
            <QuickAction icon={<History className="w-5 h-5" />} label="History" color="bg-slate-500" />
          </div>

          {/* Recent Transactions */}
          <Card className="border-none shadow-sm h-full">
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
                  <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
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
                          {tx.receiver === user?.email ? tx.sender : tx.receiver}
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

      {/* Receive Modal */}
      <AnimatePresence>
        {isReceiveOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Receive Money</CardTitle>
                    <CardDescription>Simulate an incoming transfer to your account.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsReceiveOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Receive (₦)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all text-2xl font-bold"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsReceiveOpen(false)}>Cancel</Button>
                    <Button 
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" 
                      disabled={isSubmitting}
                      onClick={handleReceive}
                    >
                      {isSubmitting ? "Receiving..." : "Add to Balance"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
              <Card className="shadow-2xl border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Send Money</CardTitle>
                    <CardDescription>Transfer funds instantly to any FinPulse user.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsTransferOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipient Email</label>
                    <input 
                      type="email" 
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="user@example.com" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₦)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all text-2xl font-bold"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
                    <Button 
                      className="flex-1 rounded-xl" 
                      disabled={isSubmitting}
                      onClick={handleTransfer}
                    >
                      {isSubmitting ? "Processing..." : "Send Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Escrow Modal */}
      <AnimatePresence>
        {isEscrowOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-500" />
                      Secure Escrow
                    </CardTitle>
                    <CardDescription>Funds will be held until both parties confirm.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsEscrowOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seller/Recipient Email</label>
                    <input 
                      type="email" 
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="seller@example.com" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Escrow Amount (₦)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none transition-all text-2xl font-bold"
                    />
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      A small 1% service fee applies to all escrow transactions to ensure buyer protection.
                    </p>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsEscrowOpen(false)}>Cancel</Button>
                    <Button 
                      className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
                      disabled={isSubmitting}
                      onClick={handleEscrow}
                    >
                      {isSubmitting ? "Securing..." : "Start Escrow"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceIcon({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={() => toast.info(`${label} service coming soon`)}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border flex items-center justify-center hover:shadow-md transition-shadow">
        {icon}
      </div>
      <span className="text-[10px] md:text-xs font-medium text-muted-foreground">{label}</span>
    </motion.button>
  );
}

function QuickAction({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <motion.button 
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center p-6 rounded-3xl bg-background border shadow-sm hover:shadow-md transition-all gap-3"
    >
      <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shadow-${color.split('-')[1]}-500/20`}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </motion.button>
  );
}
