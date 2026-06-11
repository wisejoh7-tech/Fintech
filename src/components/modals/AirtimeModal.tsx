import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { rechargeService } from "../../lib/services";
import { User } from "../../lib/types";

export default function AirtimeModal({ isOpen, onClose, user, onRefresh, initialMode = "Airtime" }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any, initialMode?: string }) {
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [mode, setMode] = useState(initialMode);
  const [dataCategory, setDataCategory] = useState("Daily");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setMode(initialMode); }, [initialMode, isOpen]);

  const networks = [
    { name: "MTN", color: "bg-yellow-400 text-yellow-900" },
    { name: "Airtel", color: "bg-red-600 text-white" },
    { name: "Glo", color: "bg-sky-600 text-white" },
    { name: "9mobile", color: "bg-sky-900 text-white" }
  ];

  const dataPlans: any = {
    "MTN": { "Daily": ["100MB - ₦100", "200MB - ₦200", "1GB - ₦300"], "Weekly": ["750MB - ₦500", "2GB - ₦1000"], "Monthly": ["1.5GB - ₦1000", "10GB - ₦2500"] },
    "Airtel": { "Daily": ["100MB - ₦100", "1GB - ₦300"], "Weekly": ["1GB - ₦600", "6GB - ₦1500"], "Monthly": ["12GB - ₦3000"] },
    "Glo": { "Daily": ["100MB - ₦100"], "Weekly": ["4GB - ₦1000"], "Monthly": ["25GB - ₦5000"] },
    "9mobile": { "Daily": ["100MB - ₦100"], "Weekly": ["2GB - ₦1000"], "Monthly": ["15GB - ₦3000"] }
  };

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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <div><CardTitle>{mode} Top-up</CardTitle></div>
                  <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button onClick={() => setMode("Airtime")} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === "Airtime" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Airtime</button>
                    <button onClick={() => setMode("Data")} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === "Data" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Data</button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-4 gap-2">
                  {networks.map(n => (
                    <button key={n.name} onClick={() => { setNetwork(n.name); }} className={`flex flex-col items-center gap-2 p-2 rounded-xl border ${network === n.name ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                      <div className={`w-10 h-10 rounded-full ${n.color} flex items-center justify-center font-black text-[10px]`}>{n.name}</div>
                      <span className="text-[10px] font-bold">{n.name}</span>
                    </button>
                  ))}
                </div>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08012345678" className="w-full p-4 border rounded-xl bg-background font-medium" />
                {mode === "Airtime" ? (
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-4 border rounded-xl bg-background font-black text-2xl" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 justify-center">
                      {["Daily", "Weekly", "Monthly"].map(cat => (
                        <button key={cat} onClick={() => { setDataCategory(cat); setAmount(""); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${dataCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{cat}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2">
                      {dataPlans[network][dataCategory].map((plan: string) => (
                        <button key={plan} onClick={() => setAmount(plan.split('₦')[1])} className={`p-4 rounded-xl border text-left flex justify-between items-center font-bold text-sm ${amount === plan.split('₦')[1] ? "border-primary bg-primary/5" : "bg-white shadow-sm"}`}>
                          {plan.split(' - ')[0]}
                          <span className="text-primary">₦{plan.split('₦')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleBuy} disabled={isSubmitting}>
                    {isSubmitting ? "..." : `Pay ₦${amount || '0'}`}
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
