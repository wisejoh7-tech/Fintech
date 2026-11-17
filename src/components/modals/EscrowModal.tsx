import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { escrowService } from "../../lib/services";
import { User } from "../../lib/types";

export default function EscrowModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user || !amount || !receiver) return;
    setIsSubmitting(true);
    try {
      await escrowService.createEscrow(user.id, { amount: parseFloat(amount), receiver, sender: user.accountNumber });
      toast.success("Escrow created successfully!");
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
                <CardTitle>Escrow Service</CardTitle>
                <CardDescription>Secure payments for goods and services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="Receiver Account/ID" className="w-full p-4 border rounded-xl bg-background" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₦)" className="w-full p-4 border rounded-xl bg-background" />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleCreate} disabled={isSubmitting}>Secure Now</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
