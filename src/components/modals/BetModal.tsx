import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { bettingService } from "../../lib/services";
import { User } from "../../lib/types";

export default function BetModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTopup = async () => {
    if (!user || !amount || !platform || !customerId) return;
    setIsSubmitting(true);
    try {
      await bettingService.topup(user.id, { platform, amount: parseFloat(amount), customerId, sender: user.accountNumber });
      toast.success("Topup successful!");
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
                <CardTitle>Betting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full p-4 border rounded-xl bg-background">
                  <option value="">Select Platform</option>
                  <option value="SportyBet">SportyBet</option>
                  <option value="Bet9ja">Bet9ja</option>
                </select>
                <input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="User ID" className="w-full p-4 border rounded-xl bg-background" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₦0.00" className="w-full p-4 border rounded-xl bg-background font-black text-2xl" />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleTopup} disabled={isSubmitting}>Topup</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
