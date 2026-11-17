import React, { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  EyeOff,
  Eye,
  Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { userService } from "../lib/services";
import { toast } from "sonner";

export default function RegisterScreen({ onRegister, onBackToLogin }: { onRegister: any, onBackToLogin: any }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReg = async () => {
    if (!name || !email || !pass || !confirmPass || !phone) { toast.error("Please fill in all fields"); return; }
    if (pass !== confirmPass) { toast.error("Passwords do not match"); return; }
    if (pass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsSubmitting(true);
    try {
      const r = await createUserWithEmailAndPassword(auth, email, pass);

      // 1. Create Firestore Profile (Legacy/Redundancy)
      await userService.createUserProfile(r.user.uid, { name, email, phoneNumber: phone, isBiometricEnabled: enableBiometrics });

      // 2. Sync to Production PostgreSQL Backend
      const { apiRequest } = await import("../lib/api");
      await apiRequest("/api/auth/sync", {
        method: 'POST',
        body: JSON.stringify({ name, phoneNumber: phone })
      });

      if (enableBiometrics) { localStorage.setItem("vivic_biometric_active", "true"); localStorage.setItem("viva_last_email", email); }
      toast.success("Account created successfully!");
      onRegister();
    } catch (e: any) {
      console.error("Registration Error:", e.code, e.message);
      let errorMessage = "Registration Failed. Please try again.";

      if (e.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (e.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Use a stronger password.";
      } else if (e.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-cover bg-center relative gap-6 overflow-y-auto" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=2071&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm p-8 bg-white/50 backdrop-blur-md rounded-[2.5rem] border-2 border-white shadow-2xl">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shrink-0"><span className="text-3xl font-black text-white">V</span></div>
        <div className="text-center"><h1 className="text-2xl font-black">Create Account</h1><p className="text-xs text-muted-foreground font-medium mt-1">Start your secure banking journey</p></div>
        <div className="w-full space-y-4">
          <div className="relative"><UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full p-4 pl-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="w-full p-4 pl-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="relative"><Phone className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-4 pl-10 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Create PIN/Password" className="w-full p-4 pl-10 pr-12 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          </div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm PIN/Password" className="w-full p-4 pl-10 pr-12 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3"><Fingerprint className="w-5 h-5 text-primary" /><div><p className="text-xs font-bold">Enable Biometric Login</p><p className="text-[10px] text-muted-foreground">Fingerprint / Face ID</p></div></div>
            <input type="checkbox" checked={enableBiometrics} onChange={e => setEnableBiometrics(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer" />
          </div>
          <Button onClick={handleReg} className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>{isSubmitting ? "Creating Account..." : "Register"}</Button>
          <button onClick={onBackToLogin} className="w-full text-center text-sm font-bold text-muted-foreground mt-2 hover:text-primary transition-colors">Already have an account? Login</button>
        </div>
      </div>
    </div>
  );
}
