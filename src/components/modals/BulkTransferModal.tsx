import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { bulkTransferService } from "../../lib/services";
import { NIGERIAN_BANKS } from "../../lib/constants";
import PinInputModal from "./PinInputModal";

export default function BulkTransferModal({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: any, onRefresh: any }) {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ accountNumber: "", bank: "Viva", amount: "", name: "" });

  const addRecipient = () => {
    if (!form.accountNumber || !form.amount) return;
    setRecipients([...recipients, { ...form, id: Date.now() }]);
    setForm({ accountNumber: "", bank: "Viva", amount: "", name: "" });
  };

  const handleBulkSend = async (pin: string) => {
    setIsSubmitting(true);
    try {
      await bulkTransferService.processBulkTransfer({ recipients, pin });
      toast.success(`Processing ${recipients.length} transfers in background!`);
      setRecipients([]);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Bulk transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[85vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Bulk Transfer</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <CardDescription className="text-[10px] font-bold uppercase">Payroll & Batch Payments</CardDescription>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-black uppercase text-primary">Add Recipient</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} placeholder="Account Number" className="p-3 text-xs border-2 rounded-xl" />
                    <select value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} className="p-3 text-xs border-2 rounded-xl bg-white">
                      {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount ₦" className="flex-1 p-3 text-xs border-2 rounded-xl font-black" />
                    <Button size="sm" onClick={addRecipient} className="rounded-xl h-10 px-4"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground ml-1">Recipient List ({recipients.length})</p>
                  {recipients.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground italic">Add accounts to start batch</p>
                  ) : (
                    <div className="space-y-2">
                      {recipients.map((r, i) => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border">
                          <div>
                            <p className="font-bold text-xs">{r.accountNumber} ({r.bank})</p>
                            <p className="text-primary font-black text-sm">₦{parseFloat(r.amount).toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setRecipients(recipients.filter((_, idx) => idx !== i))} className="text-destructive"><X className="w-3 h-3" /></Button>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-dashed">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-xs font-bold uppercase">Total Batch</p>
                          <p className="text-lg font-black">₦{recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</p>
                        </div>
                        <Button className="w-full h-12 rounded-xl font-black" onClick={() => setIsPinOpen(true)} disabled={isSubmitting}>
                          {isSubmitting ? "Processing..." : "Process Batch Transfer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <PinInputModal isOpen={isPinOpen} onClose={() => setIsPinOpen(false)} onConfirm={handleBulkSend} title="Confirm Batch" description="Enter PIN to authorize bulk payout." />
        </div>
      )}
    </AnimatePresence>
  );
}
