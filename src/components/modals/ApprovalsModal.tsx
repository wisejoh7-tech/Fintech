import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { approvalService } from "../../lib/services";
import PinInputModal from "./PinInputModal";

export default function ApprovalsModal({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: any, onRefresh: any }) {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => { if (isOpen) fetchPending(); }, [isOpen]);

  const fetchPending = async () => {
    try {
      const data = await approvalService.getPendingApprovals();
      setPending(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pin: string) => {
    try {
      await approvalService.approveTransaction(selectedId, pin);
      toast.success("Transaction approved!");
      setIsPinOpen(false);
      fetchPending();
      onRefresh();
    } catch (e: any) { toast.error(e.message || "Approval failed"); }
  };

  const handleDecline = async (id: string) => {
    try {
      await approvalService.declineTransaction(id);
      toast.info("Transaction declined");
      fetchPending();
    } catch (e) { toast.error("Action failed"); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-black">Transaction Approvals</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Corporate Governance</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Scanning Requests...</div> : pending.length === 0 ? (
                  <div className="py-10 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-20" />
                    <p className="text-muted-foreground text-sm font-medium">All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map(tx => (
                      <div key={tx.id} className="p-5 border-2 rounded-2xl bg-white space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Awaiting Approval</p>
                            <p className="font-black text-lg">₦{tx.amount.toLocaleString()}</p>
                          </div>
                          <Badge variant="outline" className="border-amber-500 text-amber-500 font-black">PENDING</Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-600">{tx.description}</p>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1 h-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 font-bold" onClick={() => handleDecline(tx.id)}>Decline</Button>
                          <Button className="flex-1 h-10 rounded-xl font-bold" onClick={() => { setSelectedId(tx.id); setIsPinOpen(true); }}>Approve</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <PinInputModal isOpen={isPinOpen} onClose={() => setIsPinOpen(false)} onConfirm={handleApprove} title="Confirm Approval" description="Enter your Transaction PIN to authorize this transfer." />
        </div>
      )}
    </AnimatePresence>
  );
}
