import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { investmentService } from "../../lib/services";
import { User } from "../../lib/types";

export default function InvestModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Fixed Deposit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvest = async () => {
    if (!user || !amount) return;
    setIsSubmitting(true);
    try {
      await investmentService.invest(user.id, { amount: parseFloat(amount), type, sender: user.accountNumber });
      toast.success(`₦${amount} Invested!`);
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
            <Card className="shadow-2xl border-primary/20">
              <CardHeader>
                <CardTitle>Invest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-4 border rounded-xl bg-background">
                  <option value="Fixed Deposit">Fixed Deposit (12% p.a)</option>
                  <option value="Mutual Funds">Mutual Funds (9% p.a)</option>
                </select>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₦0.00" className="w-full p-4 border rounded-xl bg-background font-black text-2xl" />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleInvest} disabled={isSubmitting}>Invest Now</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
