import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { paystackService } from "../../lib/services";
import { NIGERIAN_BANKS } from "../../lib/constants";
import { User } from "../../lib/types";

export default function WithdrawModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [bank, setBank] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accNum, setAccNum] = useState("");
  const [amount, setAmount] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [accName, setAccName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (accNum.length === 10 && bankCode) {
      setIsVerifying(true);
      try {
        const res = await paystackService.verifyAccount(accNum, bankCode);
        setAccName(res.account_name);
      } catch (e) {
        toast.error("Account verification failed");
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleWithdraw = async () => {
    if (!user || !amount || !accNum || !bankCode) return;
    if (parseFloat(amount) > user.balance) { toast.error("Insufficient balance"); return; }
    setIsSubmitting(true);
    try {
      const { apiRequest } = await import("../../lib/api");
      await apiRequest("/api/withdraw", {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankName: bank,
          bankCode: bankCode,
          accountNumber: accNum,
          accountName: accName || "Verified User"
        })
      });
      toast.success("Withdrawal request successful!");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-3xl">
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>Transfer to your personal bank account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Target Bank</label>
                  <select
                    value={bank}
                    onChange={e => {
                      const b = NIGERIAN_BANKS.find(x => x.name === e.target.value);
                      setBank(e.target.value);
                      setBankCode(b?.code || "");
                    }}
                    className="w-full p-4 border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Target Bank</option>
                    {NIGERIAN_BANKS.slice(1).map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Number</label>
                  <div className="relative">
                    <input
                      value={accNum}
                      onChange={e => setAccNum(e.target.value)}
                      onBlur={handleVerify}
                      placeholder="10-Digit Account Number"
                      className="w-full p-4 border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20"
                      maxLength={10}
                    />
                    {isVerifying && <RefreshCcw className="absolute right-4 top-4 w-5 h-5 animate-spin text-primary" />}
                  </div>
                  {accName && <p className="text-[10px] font-bold text-sky-600 uppercase ml-1">✓ {accName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 rounded-xl shadow-lg shadow-primary/20" onClick={handleWithdraw} disabled={isSubmitting || !accName}>
                    {isSubmitting ? "Processing..." : "Withdraw Now"}
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
