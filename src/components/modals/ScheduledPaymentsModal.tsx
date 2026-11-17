import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { recurringPaymentService } from "../../lib/services";
import { User } from "../../lib/types";

export default function ScheduledPaymentsModal({ isOpen, onClose }: { isOpen: boolean, onClose: any }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    amount: "",
    receiver: "",
    bank: "Viva",
    frequency: "MONTHLY",
    description: "",
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) fetchPayments();
  }, [isOpen]);

  const fetchPayments = async () => {
    try {
      const data = await recurringPaymentService.getScheduledPayments();
      setPayments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await recurringPaymentService.schedulePayment({
        ...form,
        amount: parseFloat(form.amount)
      });
      toast.success("Payment scheduled successfully!");
      setIsCreateOpen(false);
      fetchPayments();
    } catch (e) {
      toast.error("Failed to schedule payment");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await recurringPaymentService.cancelScheduledPayment(id);
      toast.success("Payment cancelled");
      fetchPayments();
    } catch (e) {
      toast.error("Failed to cancel payment");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black">Scheduled Payments</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Automated Corporate Payroll</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Frequency</label>
                      <select
                        value={form.frequency}
                        onChange={e => setForm({...form, frequency: e.target.value})}
                        className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary font-bold"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly (Payroll/Rent)</option>
                      </select>
                    </div>
                    <input
                      value={form.receiver}
                      onChange={e => setForm({...form, receiver: e.target.value})}
                      placeholder="Recipient Account"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({...form, amount: e.target.value})}
                        placeholder="Amount ₦"
                        className="p-4 border-2 rounded-2xl font-black"
                      />
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={e => setForm({...form, startDate: e.target.value})}
                        className="p-4 border-2 rounded-2xl"
                      />
                    </div>
                    <input
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Description (e.g. Employee Salary)"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Schedule Now</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl font-bold">
                      <Plus className="w-4 h-4 mr-2" /> Add New Automation
                    </Button>

                    {loading ? (
                      <div className="py-10 text-center opacity-50 text-[10px] font-black">Loading Automations...</div>
                    ) : payments.length === 0 ? (
                      <div className="py-10 text-center opacity-30 italic text-sm">No scheduled payments yet</div>
                    ) : (
                      payments.map(p => (
                        <div key={p.id} className="p-4 border-2 rounded-2xl flex justify-between items-center bg-slate-50">
                          <div>
                            <p className="font-black text-sm">{p.description || 'Auto Transfer'}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.frequency} • Next: {new Date(p.nextRun).toLocaleDateString()}</p>
                            <p className="text-primary font-black mt-1">₦{p.amount.toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleCancel(p.id)} className="text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
