import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Link } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { paymentLinkService } from "../../lib/services";

export default function PaymentLinksModal({ isOpen, onClose }: { isOpen: boolean, onClose: any }) {
  const [links, setLinks] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", amount: "", description: "" });

  useEffect(() => { if (isOpen) fetchLinks(); }, [isOpen]);

  const fetchLinks = async () => {
    try {
      const data = await paymentLinkService.getPaymentLinks();
      setLinks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await paymentLinkService.createPaymentLink({ ...form, amount: form.amount ? parseFloat(form.amount) : undefined });
      toast.success("Payment link created!");
      setIsCreateOpen(false);
      fetchLinks();
    } catch (e) { toast.error("Failed to create link"); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Payment Links</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
                <CardDescription className="text-[10px] font-bold uppercase">Collect money from anyone</CardDescription>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {isCreateOpen ? (
                  <div className="space-y-4">
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Link Title (e.g. Consulting Fee)" className="w-full p-4 border-2 rounded-2xl" />
                    <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Fixed Amount ₦ (Optional)" className="w-full p-4 border-2 rounded-2xl font-black" />
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full p-4 border-2 rounded-2xl" />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsCreateOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleCreate}>Create Link</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsCreateOpen(true)} className="w-full h-14 rounded-2xl font-bold bg-sky-600 shadow-lg shadow-sky-600/20"><Link className="w-4 h-4 mr-2" /> Create New Payment Link</Button>
                    {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Loading Links...</div> : links.map(l => (
                      <div key={l.id} className="p-5 border-2 rounded-2xl bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-sm">{l.title}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{l.amount ? `₦${l.amount.toLocaleString()}` : 'Flexible Amount'}</p>
                          </div>
                          <Badge className="bg-sky-100 text-sky-700 border-none font-black text-[8px]">ACTIVE</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 h-9 rounded-lg text-[10px] font-black uppercase" onClick={() => { navigator.clipboard.writeText(`https://viva.ng/pay/${l.linkId}`); toast.success("Link copied!"); }}>Copy Link</Button>
                          <Button variant="secondary" className="flex-1 h-9 rounded-lg text-[10px] font-black uppercase">Share</Button>
                        </div>
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
