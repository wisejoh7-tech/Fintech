import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { paystackService, transactionService, userService } from "../../lib/services";
import { User } from "../../lib/types";

export default function FundModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });

  const handleFund = async () => {
    if (!user || !amount) { toast.error("Enter amount"); return; }
    setIsSubmitting(true);
    if (method === 'card') {
      try {
        await paystackService.initializeTransaction(user.email, parseFloat(amount), async () => {
          await transactionService.addTransaction(user.id, { amount: parseFloat(amount), type: 'deposit', sender: 'Card', receiver: user.accountNumber, status: 'success' });
          await userService.updateBalance(user.id, parseFloat(amount));
          toast.success("Funded!");
          onRefresh();
          onClose();
          setIsSubmitting(false);
        });
      }
      catch (e: any) {
        toast.error("Failed");
        setIsSubmitting(false);
      }
      return;
    }
    try {
      await transactionService.addTransaction(user.id, { amount: parseFloat(amount), type: 'deposit', sender: 'Transfer', receiver: user.accountNumber, status: 'success' });
      await userService.updateBalance(user.id, parseFloat(amount));
      toast.success("Funded!");
      onRefresh();
      onClose();
    }
    catch (e: any) {
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
                <CardTitle>Fund Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <Tabs defaultValue="transfer" onValueChange={setMethod}>
                  <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-xl">
                    <TabsTrigger value="transfer" className="rounded-lg font-bold">Transfer</TabsTrigger>
                    <TabsTrigger value="card" className="rounded-lg font-bold">Card</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transfer" className="space-y-4 pt-4">
                    <div className="p-6 bg-sky-50 rounded-2xl border-2 border-dashed border-primary/20 text-center">
                      <p className="text-[10px] text-sky-800 uppercase font-black tracking-widest mb-2">Virtual Account</p>
                      <p className="text-3xl font-black text-sky-800 tracking-tighter">{user?.accountNumber}</p>
                      <p className="text-[10px] text-muted-foreground mt-3 font-bold">Bank: {user?.providerBank || "VIVA BANK"}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">Transfer to this account from any bank app to fund your wallet instantly.</p>
                      <button onClick={() => { navigator.clipboard.writeText(user?.accountNumber || ""); toast.success("Copied!"); }} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-sky-500 text-white rounded-full text-xs font-bold">Copy Number</button>
                    </div>
                  </TabsContent>
                  <TabsContent value="card" className="space-y-4 pt-4">
                    <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-4">
                      <input value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} placeholder="0000 0000 0000 0000" className="w-full bg-transparent border-none text-xl font-mono outline-none" />
                      <div className="flex gap-4">
                        <input value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} placeholder="MM/YY" className="w-16 bg-transparent border-none text-xs outline-none" />
                        <input value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} placeholder="CVV" className="w-12 bg-transparent border-none text-xs outline-none" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl">₦</span>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-6 pl-10 border-2 rounded-2xl bg-background font-black text-3xl outline-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" onClick={handleFund} disabled={isSubmitting}>{isSubmitting ? "..." : "Fund Now"}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
