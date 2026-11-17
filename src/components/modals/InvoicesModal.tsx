import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { invoiceService } from "../../lib/services";

export default function InvoicesModal({ isOpen, onClose }: { isOpen: boolean, onClose: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", amount: "", dueDate: "", description: "" });

  useEffect(() => { if (isOpen) fetchInvoices(); }, [isOpen]);

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await invoiceService.createInvoice({ ...form, amount: parseFloat(form.amount) });
      toast.success("Invoice sent to client!");
      setIsCreateOpen(false);
      fetchInvoices();
    } catch (e) {
      toast.error("Failed to create invoice");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Invoices</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <input value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} placeholder="Client Name" className="w-full p-4 border-2 rounded-2xl" />
                    <input value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="Client Email" className="w-full p-4 border-2 rounded-2xl" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount ₦" className="p-4 border-2 rounded-2xl font-black" />
                      <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="p-4 border-2 rounded-2xl" />
                    </div>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Project Description" className="w-full p-4 border-2 rounded-2xl min-h-[100px]" />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Create & Send</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl font-bold"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
                    {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Loading...</div> : invoices.map(i => (
                      <div key={i.id} className="p-4 border-2 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div>
                          <p className="font-black text-sm">{i.clientName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Due: {new Date(i.dueDate).toLocaleDateString()} • {i.status}</p>
                          <p className="text-primary font-black mt-1">₦{i.amount.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className={i.status === 'PAID' ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}>{i.status}</Badge>
                      </div>
                    ))}
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
