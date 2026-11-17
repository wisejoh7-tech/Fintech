import React, { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  EyeOff,
  Eye,
  Fingerprint,
  Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from "capacitor-native-biometric";
import { toast } from "sonner";

export default function LoginScreen({ onLogin, onGoToRegister }: { onLogin: any, onGoToRegister: any }) {
  const [email, setEmail] = useState(localStorage.getItem("viva_last_email") || "demo@viva.com");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { toast.error("Please fill in all fields"); return; }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem("viva_last_email", email);
      localStorage.setItem("viva_biometric_active", "true");
      onLogin();
    } catch (e: any) {
      console.error("Login Error:", e.code, e.message);
      let errorMessage = "Login Failed. Please try again.";

      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (e.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (e.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    }
    finally { setIsSubmitting(false); }
  };

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem("viva_last_email");
    if (!localStorage.getItem("viva_biometric_active") || !savedEmail) { toast.error("Please log in with password once to enable biometrics"); return; }
    if (!Capacitor.isNativePlatform()) { toast.info("Biometric login is only available on native devices"); return; }
    try {
      const resultAvailable = await NativeBiometric.isAvailable();
      if (!resultAvailable.isAvailable) { toast.error("Biometrics not available on this device"); return; }
      await NativeBiometric.verifyIdentity({ reason: "Log in to Viva Mobile", title: "Security Verification", subtitle: "Use biometrics to authenticate", description: "Please verify your identity to continue to your account" });
      setIsBiometricScanning(true);
      toast.success("Identity Verified Successfully");
      onLogin();
    } catch (e: any) { if (e.message !== "user cancelled") toast.error("Biometric Authentication Failed"); }
    finally { setIsBiometricScanning(false); }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-cover bg-center relative gap-6" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601597111158-2fcee27173bd?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm p-8 bg-white/50 backdrop-blur-md rounded-[2.5rem] border-2 border-white shadow-2xl">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl relative">
          <span className="text-4xl font-black text-white">V</span>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full border-4 border-slate-50 flex items-center justify-center"><ShieldCheck className="w-3 h-3 text-white" /></div>
        </motion.div>
        <div className="text-center"><h1 className="text-2xl font-black tracking-tight">Vivic Mobile Banking</h1><p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Digital Banking</p></div>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="w-full space-y-4">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
            <div className="relative"><Mail className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full p-4 pl-12 border-2 rounded-2xl bg-white outline-none focus:border-primary/30 transition-colors font-medium" required /></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
            <div className="relative"><Lock className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="w-full p-4 pl-12 pr-12 border-2 rounded-2xl bg-white outline-none focus:border-primary/30 transition-colors font-medium" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2"><Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20" disabled={isSubmitting || isBiometricScanning}>{isSubmitting ? "Authenticating..." : "Sign In Securely"}</Button>
            <div className="relative flex items-center py-4"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink mx-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Quick Access</span><div className="flex-grow border-t border-slate-200"></div></div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-16 rounded-2xl border-2 border-primary/10 bg-white hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group" onClick={handleBiometricLogin} disabled={isSubmitting || isBiometricScanning}><Fingerprint className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase tracking-tighter">Touch ID</span></Button>
              <Button type="button" variant="outline" className="h-16 rounded-2xl border-2 border-primary/10 bg-white hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all group" onClick={() => onGoToRegister()} disabled={isSubmitting || isBiometricScanning}><Scan className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase tracking-tighter">Face ID</span></Button>
            </div>
          </div>
        </form>
        <button type="button" onClick={onGoToRegister} className="w-full text-center text-[10px] font-black text-muted-foreground mt-4 hover:text-primary transition-colors uppercase tracking-widest">No account? <span className="text-primary">Create one now</span></button>
      </div>
      {isBiometricScanning && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl"><div className="relative"><motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-32 h-32 rounded-full border-4 border-primary/10 border-t-primary" /><div className="absolute inset-0 flex items-center justify-center"><Fingerprint className="w-12 h-12 text-primary animate-pulse" /></div></div><div className="text-center mt-8 space-y-2"><h3 className="text-xl font-black tracking-tight">Biometric Verification</h3><p className="text-sm text-muted-foreground font-medium">Scanning for Touch ID / Face ID</p></div><Button variant="ghost" className="mt-12 text-muted-foreground font-bold" onClick={() => setIsBiometricScanning(false)}>Cancel Scan</Button></motion.div>)}
    </div>
  );
}
