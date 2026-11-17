import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Smartphone, Lock, ChevronRight, Phone, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userService, biometricService } from "../../lib/services";
import { User } from "../../lib/types";

export default function SecurityCenterModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [isBio, setIsBio] = useState(user?.isBiometricEnabled || false);
  const [is2FA, setIs2FA] = useState(user?.is2FAEnabled || false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    setIsBio(user?.isBiometricEnabled || false);
    setIs2FA(user?.is2FAEnabled || false);
  }, [user]);

  const handleSetPin = async () => {
    if (newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    try {
      await userService.setTransactionPin(newPin);
      toast.success("Transaction PIN set successfully!");
      setShowPinDialog(false);
      setNewPin("");
      onRefresh();
    } catch (e) {
      toast.error("Failed to set PIN");
    }
  };

  const toggleBio = async () => {
    if (!user) return;
    const newVal = !isBio;
    if (newVal) {
      try {
        toast.info("Preparing biometric registration...");
        await biometricService.registerBiometrics(user.email);
        setIsBio(true);
        await userService.updateProfile(user.id, { isBiometricEnabled: true });
        localStorage.setItem("viva_biometric_active", "true");
        localStorage.setItem("viva_last_email", user.email);
        toast.success("Biometrics Registered Successfully");
        onRefresh();
      } catch (e: any) {
        toast.error(e.message || "Registration failed");
        setIsBio(false);
      }
    } else {
      setIsBio(false);
      try {
        await userService.updateProfile(user.id, { isBiometricEnabled: false });
        localStorage.removeItem("viva_biometric_active");
        toast.success("Biometrics Disabled");
        onRefresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const toggle2FA = async () => {
    if (!user) return;
    const newVal = !is2FA;
    setIs2FA(newVal);
    try {
      await userService.updateProfile(user.id, { is2FAEnabled: newVal });
      toast.success(`2FA ${newVal ? 'Enabled' : 'Disabled'}`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
            <Card className="rounded-3xl shadow-2xl overflow-hidden border-primary/20">
              <CardHeader className="bg-primary text-white">
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Security Hub</CardTitle>
                <CardDescription className="text-white/70">Protect your account and get help.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 text-foreground">
                <div className="divide-y">
                  <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Smartphone className="w-4 h-4" /></div>
                      <div><p className="text-sm font-bold">Biometric Login</p><p className="text-[10px] text-muted-foreground">Fingerprint/Face ID</p></div>
                    </div>
                    <input type="checkbox" checked={isBio} onChange={toggleBio} className="w-5 h-5 accent-primary cursor-pointer" />
                  </div>

                  <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Lock className="w-4 h-4" /></div>
                      <div><p className="text-sm font-bold">Two-Factor Auth</p><p className="text-[10px] text-muted-foreground">Extra layer of security</p></div>
                    </div>
                    <input type="checkbox" checked={is2FA} onChange={toggle2FA} className="w-5 h-5 accent-primary cursor-pointer" />
                  </div>

                  <div className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setShowPinDialog(true)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><Lock className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm font-bold">{user?.transactionPin ? "Change Transaction PIN" : "Set Transaction PIN"}</p>
                        <p className="text-[10px] text-muted-foreground">Required for all transfers</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="p-4 bg-slate-50/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Help & Support</p>
                    <div className="space-y-2">
                      <a href="tel:08183793358" className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors"><Phone className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Call Support: 08183793358</span></a>
                      <a href="mailto:support@vivamobile.ng" className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors"><Mail className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Email Us</span></a>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4">
                <Button onClick={onClose} className="w-full rounded-xl">Got it</Button>
              </CardFooter>
            </Card>

            <AnimatePresence>
              {showPinDialog && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[300px]">
                    <Card className="rounded-[2rem]">
                      <CardHeader className="text-center">
                        <CardTitle className="text-lg">Set 4-Digit PIN</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <input
                          type="password"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="••••"
                          className="w-full text-center text-3xl font-black tracking-[1em] p-4 border-2 rounded-2xl bg-slate-50 outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1" onClick={() => setShowPinDialog(false)}>Cancel</Button>
                          <Button className="flex-1" onClick={handleSetPin}>Save</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
