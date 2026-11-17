import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Plus,
  CreditCard,
  Wifi,
  X,
  Eye,
  RefreshCcw,
  Lock,
  ShieldCheck,
  Settings,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cardService } from "../lib/services";
import { User } from "../lib/types";

function CreateCardModal({ isOpen, onClose, onCreated }: any) {
  const [type, setType] = useState("Corporate Mastercard");
  const [color, setColor] = useState("bg-slate-900");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { id: "bg-slate-900", label: "Midnight" },
    { id: "bg-gradient-to-br from-purple-600 to-blue-600", label: "Deep Sea" },
    { id: "bg-gradient-to-br from-emerald-500 to-teal-700", label: "Emerald" },
    { id: "bg-gradient-to-br from-orange-500 to-red-600", label: "Lava" },
  ];

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await cardService.createCard({ type, color });
      toast.success("Card created successfully!");
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to create card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-xl font-black">New Virtual Card</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Issuance Fee: ₦1,000</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className={`h-48 w-full ${color} rounded-3xl p-6 text-white shadow-xl transition-all duration-500 flex flex-col justify-between`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Viva Business</p>
                  <p className="text-xl font-mono tracking-widest font-bold">•••• •••• •••• ••••</p>
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-black uppercase">YOUR NAME</p>
                    <div className="w-10 h-6 bg-white/20 rounded-sm" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Card Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full p-4 border-2 rounded-2xl bg-white outline-none focus:border-primary transition-colors font-bold">
                      <option>Corporate Mastercard</option>
                      <option>Virtual Visa Card</option>
                      <option>USD Corporate Card</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Choose Design</label>
                    <div className="flex gap-3">
                      {colors.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setColor(c.id)}
                          className={`w-10 h-10 rounded-full ${c.id} border-2 ${color === c.id ? 'border-primary' : 'border-white'} shadow-sm transition-transform active:scale-90`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20" onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting ? "Issuing..." : "Pay ₦1,000"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function CardsView({ user, onRefresh }: { user: User | null, onRefresh: any }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const data = await cardService.getCards();
      setCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (cardId: string) => {
    setIsRevealing(true);
    try {
      const details = await cardService.getCardDetails(cardId);
      setCardDetails(details);
    } catch (e) {
      toast.error("Failed to reveal card details");
    } finally {
      setIsRevealing(false);
    }
  };

  const toggleFreeze = async (card: any) => {
    const newStatus = card.status === 'active' ? 'frozen' : 'active';
    try {
      await cardService.updateCardStatus(card.id, newStatus);
      toast.success(`Card ${newStatus === 'active' ? 'unfrozen' : 'frozen'} successfully`);
      fetchCards();
    } catch (e) {
      toast.error("Failed to update card status");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-black">Virtual Cards</h2>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="rounded-xl h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> New Card
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 opacity-50 font-bold uppercase tracking-widest text-[10px]">Loading Cards...</div>
      ) : cards.length === 0 ? (
        <div className="text-center space-y-6 py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CreditCard className="w-10 h-10 text-primary opacity-20" />
          </div>
          <div>
            <p className="font-black text-slate-900">No Virtual Cards</p>
            <p className="text-xs text-muted-foreground mt-1">Create a card to start making secure online payments.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl px-8">Create Your First Card</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layoutId={card.id}
              onClick={() => { setSelectedCard(card); setCardDetails(null); }}
              className={`relative h-56 w-full ${card.color} rounded-[2rem] p-8 text-white shadow-2xl cursor-pointer overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-colors" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{card.type}</p>
                    <h3 className="text-lg font-black mt-1">Viva Business</h3>
                  </div>
                  <div className="w-12 h-8 bg-white/20 rounded-md backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Wifi className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl font-mono tracking-[0.2em] font-bold">
                    •••• •••• •••• {card.last4}
                  </p>
                  <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest opacity-70">
                    <div>
                      <p>Expiry</p>
                      <p className="text-sm font-mono mt-0.5">{card.expiry}</p>
                    </div>
                    <div>
                      <p>CVV</p>
                      <p className="text-sm font-mono mt-0.5">•••</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <p className="font-black uppercase tracking-tight text-sm">{card.name}</p>
                  <div className="flex gap-2">
                    {card.status === 'frozen' && <Badge className="bg-red-500/20 text-red-100 border-none text-[8px] font-black uppercase">Frozen</Badge>}
                    <div className="w-10 h-6 bg-orange-400 rounded-sm opacity-80" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCard(null)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black">{selectedCard.type}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Managed Virtual Card</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCard(null)} className="rounded-full bg-slate-100">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className={`w-full aspect-video ${selectedCard.color} rounded-3xl p-6 text-white relative overflow-hidden shadow-xl`}>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Viva Business</p>
                    <div className="space-y-4">
                      <p className="text-2xl font-mono tracking-widest font-bold">
                        {cardDetails ? cardDetails.pan.replace(/(.{4})/g, '$1 ') : `•••• •••• •••• ${selectedCard.last4}`}
                      </p>
                      <div className="flex gap-10">
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-60">Expiry</p>
                          <p className="text-sm font-mono font-bold">{selectedCard.expiry}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-60">CVV</p>
                          <p className="text-sm font-mono font-bold">{cardDetails ? cardDetails.cvv : '•••'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="h-14 rounded-2xl font-black"
                    onClick={() => handleReveal(selectedCard.id)}
                    disabled={isRevealing || !!cardDetails}
                  >
                    {isRevealing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    {cardDetails ? "Details Visible" : "Show Details"}
                  </Button>
                  <Button
                    variant="outline"
                    className={`h-14 rounded-2xl font-black ${selectedCard.status === 'active' ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-sky-600 border-sky-100 hover:bg-sky-50'}`}
                    onClick={() => toggleFreeze(selectedCard)}
                  >
                    {selectedCard.status === 'active' ? <Lock className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    {selectedCard.status === 'active' ? "Freeze Card" : "Unfreeze"}
                  </Button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Controls</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border text-slate-600"><Settings className="w-4 h-4" /></div>
                      <span className="text-sm font-bold">Transaction Limit</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateCardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => { fetchCards(); onRefresh(); }} />
    </div>
  );
}
