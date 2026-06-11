import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Tv, Zap, Gamepad2, Hash, ShieldCheck, Wallet, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MoreModal({ isOpen, onClose, setters }: { isOpen: boolean, onClose: any, setters: any }) {
  const services = [
    { icon: <Globe />, label: "Data", onClick: () => { setters.setAirtimeMode("Data"); setters.setIsAirtimeOpen(true); onClose(); } },
    { icon: <Tv />, label: "Cable TV", onClick: () => { setters.setBillsType("Cable TV"); setters.setIsBillsOpen(true); onClose(); } },
    { icon: <Zap />, label: "Power", onClick: () => { setters.setBillsType("Electricity"); setters.setIsBillsOpen(true); onClose(); } },
    { icon: <Gamepad2 />, label: "Betting", onClick: () => { setters.setIsBetOpen(true); onClose(); } },
    { icon: <Hash />, label: "USSD", onClick: () => { setters.setIsUSSDOpen(true); onClose(); } },
    { icon: <ShieldCheck />, label: "Security", onClick: () => { setters.setIsSecurityModalOpen(true); onClose(); } },
    { icon: <Wallet />, label: "Fund", onClick: () => { setters.setIsFundOpen(true); onClose(); } },
    { icon: <Info />, label: "Help", onClick: () => { window.location.href="tel:08183793358"; } },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
            <Card className="rounded-3xl shadow-2xl overflow-hidden border-primary/20">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle>All Services</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-6 p-8">
                {services.map((s, i) => (
                  <button key={i} onClick={s.onClick} className="flex flex-col items-center gap-2 group outline-none">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 text-foreground group-active:scale-90">{s.icon}</div>
                    <span className="text-[10px] font-bold text-foreground text-center">{s.label}</span>
                  </button>
                ))}
              </CardContent>
              <CardFooter className="bg-slate-50 border-t pt-4 pb-4">
                <Button variant="ghost" className="w-full font-bold" onClick={onClose}>Close</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
