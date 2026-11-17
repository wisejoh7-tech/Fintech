import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Globe,
  Eye,
  EyeOff,
  RefreshCcw,
  Copy,
  Smartphone,
  Building2,
  QrCode,
  Lock,
  FileCheck,
  UserCog,
  ShieldCheck,
  Hash,
  Gamepad2,
  ChevronRight,
  Search,
  History,
  Activity as ActivityIcon,
  Cpu,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { toast } from "sonner";
import { NIGERIAN_BANKS } from "../lib/constants";
import { getApiUrl } from "../lib/api";
import { userService, beneficiaryService } from "../lib/services";
import { User, Transaction, Account } from "../lib/types";

// Sub-components
function ActionItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{label}</span>
    </button>
  );
}

function ServiceIcon({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-primary/30 transition-all">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-600">{label}</span>
    </button>
  );
}

function SpendingDonut({ transactions }: { transactions: Transaction[] }) {
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

function AIInsightsSection({ userId }: { userId: string | undefined }) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchInsights = async () => {
      try {
        const { apiRequest } = await import("../lib/api");
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

  if (!insights) return null;

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
            <RefreshCcw className="w-4 h-4" />
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

export default function Dashboard({
  user, transactions, onRefresh, setIsBillsOpen, setIsAirtimeOpen, setIsInvestOpen,
  setIsSecurityModalOpen, setIsEditProfileOpen, setIsBetOpen, setIsScanOpen,
  setIsUSSDOpen, setIsMoreOpen, setIsFundOpen, setIsWithdrawOpen,
  accounts, activeAccountIndex, setActiveAccountIndex, setIsPinOpen, setPendingAction, beneficiaries,
  setIsVaultsOpen, setIsScheduledOpen, setIsInvoicesOpen, setIsStaffOpen, setIsApprovalsOpen, setIsBulkOpen, setIsPaymentLinksOpen,
  setSelectedTransaction, setIsReceiptOpen
}: any) {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const activeAccount = useMemo(() => {
    if (Array.isArray(accounts) && accounts.length > 0 && accounts[activeAccountIndex]) {
      return accounts[activeAccountIndex];
    }
    return {
      id: 'default',
      currency: 'NGN',
      balance: user?.balance || 0,
      accountNumber: user?.accountNumber || '---'
    };
  }, [accounts, activeAccountIndex, user]);

  const categories = ["All", "Transfer", "Deposit", "Bill", "Airtime"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: Transaction) => {
      const matchesSearch =
        (tx.receiver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase())));

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
      const recUser: any = await userService.getUser(recipient);
      if (recUser) setResolvedName(recUser.name);
    } catch (e) {
      console.error("Resolve failed", e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !user) return;

    if (!user.transactionPin) {
      toast.info("Please set your Transaction PIN in Profile > Security first.");
      return;
    }

    setPendingAction(() => async (pin: string) => {
      setIsSubmitting(true);
      try {
        const { apiRequest } = await import("../lib/api");
        await apiRequest("/api/transfer", {
          method: 'POST',
          body: JSON.stringify({
            receiver: recipient,
            amount: parseFloat(amount),
            bank,
            bankCode,
            pin,
            senderAccountId: activeAccount?.id
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

        const data = await apiRequest("/api/accounts");
      } catch (e: any) {
        toast.error(e.message || "Transfer failed");
      }
      finally { setIsSubmitting(false); }
    });

    setIsPinOpen(true);
  };

  const handleCreateWallet = async (currency: string) => {
    try {
      const { apiRequest } = await import("../lib/api");
      await apiRequest("/api/accounts/create", {
        method: 'POST',
        body: JSON.stringify({ currency })
      });
      toast.success(`${currency} wallet created!`);
      onRefresh();
    } catch (e) {
      toast.error("Failed to create wallet");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="relative group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeAccount.id + activeAccountIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className={`bg-gradient-to-br ${activeAccount.currency === 'USD' ? 'from-slate-800 to-slate-950' : activeAccount.currency === 'GBP' ? 'from-indigo-800 to-indigo-950' : 'from-[#0ea5e9] to-[#0369a1]'} text-white border-none shadow-2xl relative overflow-hidden p-6 rounded-3xl h-64 flex flex-col justify-between`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                        {activeAccount.currency || 'NGN'} Balance
                      </p>
                      {Array.isArray(accounts) && accounts.length > 1 && (
                        <div className="flex gap-1">
                          {accounts.map((_: any, idx: number) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${idx === activeAccountIndex ? 'bg-white' : 'bg-white/30'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <h2 className="text-4xl font-black">
                      {showBalance ? (
                        activeAccount.currency === 'USD' ? `$${(activeAccount.balance || 0).toLocaleString()}` :
                        activeAccount.currency === 'GBP' ? `£${(activeAccount.balance || 0).toLocaleString()}` :
                        `₦${(activeAccount.balance || 0).toLocaleString()}.00`
                      ) : "****"}
                    </h2>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Acc: {activeAccount.accountNumber || user?.accountNumber}</p>
                      <button onClick={() => { navigator.clipboard.writeText(activeAccount.accountNumber); toast.success("Copied!"); }} className="hover:text-white transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setShowBalance(!showBalance)} className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">{showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}</button>
                    {Array.isArray(accounts) && accounts.length > 1 && (
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
                  <DropdownMenuTrigger>
                    <button className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20"><Globe className="w-5 h-5" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Wallets</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Create Wallet</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCreateWallet('USD')} disabled={Array.isArray(accounts) && accounts.some((a: any) => a.currency === 'USD')}>US Dollar ($)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateWallet('GBP')} disabled={Array.isArray(accounts) && accounts.some((a: any) => a.currency === 'GBP')}>British Pound (£)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateWallet('EUR')} disabled={Array.isArray(accounts) && accounts.some((a: any) => a.currency === 'EUR')}>Euro (€)</DropdownMenuItem>
                    </DropdownMenuGroup>
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
        <ServiceIcon icon={<CreditCard className="text-pink-500" />} label="Cards" onClick={() => navigate("/cards")} />
        <ServiceIcon icon={<QrCode className="text-slate-700" />} label="Scan" onClick={() => setIsScanOpen(true)} />
        <ServiceIcon icon={<ActivityIcon className="text-red-500" />} label="Invest" onClick={() => setIsInvestOpen(true)} />
        <ServiceIcon icon={<RefreshCcw className="text-emerald-500" />} label="Schedule" onClick={() => setIsScheduledOpen(true)} />
        <ServiceIcon icon={<Lock className="text-orange-500" />} label="Vaults" onClick={() => setIsVaultsOpen(true)} />
        <ServiceIcon icon={<FileCheck className="text-blue-600" />} label="Invoices" onClick={() => setIsInvoicesOpen(true)} />
        <ServiceIcon icon={<UserCog className="text-slate-900" />} label="Team" onClick={() => setIsStaffOpen(true)} />
        <ServiceIcon icon={<ShieldCheck className="text-amber-600" />} label="Approvals" onClick={() => setIsApprovalsOpen(true)} />
        <ServiceIcon icon={<ArrowUpRight className="text-purple-600" />} label="Bulk" onClick={() => setIsBulkOpen(true)} />
        <ServiceIcon icon={<Globe className="text-sky-600" />} label="Checkout" onClick={() => setIsPaymentLinksOpen(true)} />
        <ServiceIcon icon={<Hash className="text-indigo-500" />} label="USSD" onClick={() => setIsUSSDOpen(true)} />
        <ServiceIcon icon={<Gamepad2 className="text-purple-500" />} label="Betting" onClick={() => setIsBetOpen(true)} />
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-xl h-8 px-3 text-[10px] font-black uppercase">
                <ArrowDownLeft className="w-3 h-3 mr-1" /> Export
              </Button>
              <Link to="/history" className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View All <ChevronRight className="w-3 h-3" /></Link>
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
                    <Button variant="ghost" size="icon" onClick={() => setIsTransferOpen(false)}><RefreshCcw className="w-4 h-4" /></Button>
                  </div>
                  <CardDescription>Transfer to Viva or other banks.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {beneficiaries.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Saved Beneficiaries</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {beneficiaries.map((b: any) => (
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
