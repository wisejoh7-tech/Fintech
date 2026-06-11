import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, X, Download, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Transaction } from "../../lib/types";

export default function TransactionReceiptModal({ isOpen, onClose, transaction, user }: { isOpen: boolean, onClose: any, transaction: Transaction | null, user: User | null }) {
  if (!transaction) return null;
  const isCredit = transaction.type === 'deposit' || transaction.type === 'receive' || (transaction.receiver === user?.accountNumber);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden bg-white">
              <div className="bg-primary p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Transaction Successful</h3>
                <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Receipt Generated</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Amount</p>
                  <h2 className="text-3xl font-black text-slate-900">
                    {isCredit ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                  </h2>
                </div>

                <div className="space-y-4 border-y border-dashed py-6">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground">Type</span>
                    <span>{transaction.type}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-emerald-600">Success</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground">Receiver</span>
                    <span className="truncate max-w-[150px]">{transaction.receiver}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="truncate max-w-[150px] font-mono text-[10px] uppercase opacity-70">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-muted-foreground">Date</span>
                    <span>{new Date(transaction.date).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold"><Download className="w-4 h-4 mr-2" /> Save</Button>
                  <Button className="flex-1 rounded-xl h-12 font-bold"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                </div>

                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={onClose}>Done</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
