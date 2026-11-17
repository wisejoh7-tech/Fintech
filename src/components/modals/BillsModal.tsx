import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { billService } from "../../lib/services";
import { User } from "../../lib/types";

export default function BillsModal({ isOpen, onClose, user, onRefresh, initialType = "Electricity" }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any, initialType?: string }) {
  const [billerType, setBillerType] = useState(initialType);
  const [biller, setBiller] = useState("");
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setBillerType(initialType); setBiller(""); }, [initialType, isOpen]);

  const billers: any = {
    "Electricity": ["EKEDC", "IKEDC", "AEDC", "KEDCO"],
    "Internet": ["MTN Fiber", "Airtel Home", "Spectranet", "Smile"],
    "Cable TV": ["DSTV", "GOTV", "Startimes", "Showmax"]
  };

  const handlePay = async () => {
    if (!user || !amount || !biller || !customerId) { toast.error("Please fill in all details"); return; }
    if (!user.transactionPin) { toast.info("Please set your Transaction PIN in Security Hub first."); return; }

    const pin = prompt("Enter your 4-digit Transaction PIN");
    if (!pin) return;

    setIsSubmitting(true);
    try {
      await billService.payBill(user.id, { biller: `${billerType}: ${biller}`, amount: parseFloat(amount), customerId, pin });
      toast.success(`${billerType} payment successful!`);
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
                <CardTitle>Bill Payments</CardTitle>
                <CardDescription>Pay your utility bills instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(billers).map(type => (
                    <button key={type} onClick={() => { setBillerType(type); setBiller(""); }} className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${billerType === type ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-slate-50'}`}>{type}</button>
                  ))}
                </div>
                <select value={biller} onChange={e => setBiller(e.target.value)} className="w-full p-4 border rounded-xl bg-background text-sm">
                  <option value="">Select Biller Provider</option>
                  {billers[billerType].map((b: string) => <option key={b} value={b}>{b}</option>)}
                </select>
                <input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="Customer ID / Smart Card Number" className="w-full p-4 border rounded-xl bg-background" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₦)" className="w-full p-4 border rounded-xl bg-background font-bold text-lg" />
                <div className="flex gap-2 pt-4">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handlePay} disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Pay Bill Now"}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
