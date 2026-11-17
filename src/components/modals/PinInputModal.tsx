import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PinInputModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Secure Verification",
  description = "Enter your 4-digit Transaction PIN to proceed."
}: {
  isOpen: boolean,
  onClose: any,
  onConfirm: (pin: string) => void,
  title?: string,
  description?: string
}) {
  const [pin, setPin] = useState("");

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin);
      setPin("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[320px]">
            <Card className="rounded-[2.5rem] shadow-2xl border-none">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-black">{title}</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-tight">{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full text-center text-4xl font-black tracking-[1em] p-6 border-2 rounded-3xl bg-slate-50 outline-none focus:border-primary transition-all"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => { setPin(""); onClose(); }}>Cancel</Button>
                  <Button className="flex-1 h-12 rounded-xl font-black shadow-lg" onClick={handleConfirm} disabled={pin.length !== 4}>Confirm</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
