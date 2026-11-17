import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { vaultService } from "../../lib/services";
import { User } from "../../lib/types";

export default function VaultsModal({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: any, onRefresh: any }) {
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    category: "SAVINGS",
    lockUntil: "",
  });

  useEffect(() => {
    if (isOpen) fetchVaults();
  }, [isOpen]);

  const fetchVaults = async () => {
    try {
      const data = await vaultService.getVaults();
      setVaults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await vaultService.createVault({
        ...form,
        targetAmount: form.targetAmount ? parseFloat(form.targetAmount) : undefined,
        interestRate: 8.5
      });
      toast.success("Vault created! Earning 8.5% p.a.");
      setIsCreateOpen(false);
      fetchVaults();
    } catch (e) {
      toast.error("Failed to create vault");
    }
  };

  const handleAction = async (action: 'fund' | 'withdraw') => {
    if (!selectedVault || !amount) return;
    setIsProcessing(true);
    try {
      if (action === 'fund') {
        await vaultService.fundVault(selectedVault.id, parseFloat(amount));
        toast.success("Vault funded successfully");
      } else {
        await vaultService.withdrawFromVault(selectedVault.id, parseFloat(amount));
        toast.success("Withdrawn to main account");
      }
      setAmount("");
      setSelectedVault(null);
      fetchVaults();
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[85vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black">Savings Vaults</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Corporate Treasury & Interest</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <input
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Vault Name (e.g. Q4 Taxes)"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <select
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full p-4 border-2 rounded-2xl bg-white"
                    >
                      <option value="SAVINGS">General Savings (8.5% p.a)</option>
                      <option value="TAX">Tax Reserve</option>
                      <option value="EMERGENCY">Emergency Fund</option>
                    </select>
                    <input
                      type="number"
                      value={form.targetAmount}
                      onChange={e => setForm({...form, targetAmount: e.target.value})}
                      placeholder="Target Amount (Optional)"
                      className="w-full p-4 border-2 rounded-2xl"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Lock Until (Optional)</label>
                      <input
                        type="date"
                        value={form.lockUntil}
                        onChange={e => setForm({...form, lockUntil: e.target.value})}
                        className="w-full p-4 border-2 rounded-2xl"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Create Vault</Button>
                    </div>
                  </div>
                ) : selectedVault ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-primary text-white rounded-[2rem] text-center">
                      <p className="text-[10px] font-black uppercase opacity-60">{selectedVault.name}</p>
                      <h2 className="text-3xl font-black mt-2">₦{selectedVault.balance.toLocaleString()}</h2>
                      <p className="text-[10px] font-bold mt-2">Interest: {selectedVault.interestRate}% p.a.</p>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-6 border-2 rounded-2xl text-center text-2xl font-black"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-14 rounded-2xl font-bold" onClick={() => handleAction('fund')} disabled={isProcessing}>
                          Fund Vault
                        </Button>
                        <Button className="h-14 rounded-2xl font-bold" onClick={() => handleAction('withdraw')} disabled={isProcessing}>
                          Withdraw
                        </Button>
                      </div>
                      <Button variant="ghost" className="w-full" onClick={() => setSelectedVault(null)}>Back to list</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/10">
                      <Plus className="w-4 h-4 mr-2" /> Open New Vault
                    </Button>

                    {loading ? (
                      <div className="py-10 text-center opacity-50 text-[10px] font-black">Scanning Vaults...</div>
                    ) : vaults.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <TrendingUp className="w-10 h-10 mx-auto opacity-10" />
                        <p className="text-muted-foreground text-sm">No vaults active</p>
                      </div>
                    ) : (
                      vaults.map(v => (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVault(v)}
                          className="p-5 border-2 rounded-[1.5rem] flex justify-between items-center bg-slate-50 hover:border-primary/30 transition-all cursor-pointer group"
                        >
                          <div>
                            <p className="font-black text-sm">{v.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{v.category} • {v.interestRate}% Interest</p>
                            <p className="text-primary font-black mt-2 text-lg">₦{v.balance.toLocaleString()}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
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
