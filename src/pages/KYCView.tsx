import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userService, storageService, paystackService } from "../lib/services";
import { User } from "../lib/types";

export default function KYCView({ user, onRefresh }: { user: User | null, onRefresh: any }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bvn, setBvn] = useState(user?.bvn || ""); // user.bvn might not be in User type yet, assuming it is or handled
  const [nin, setNin] = useState(user?.nin || "");
  const [utilityBill, setUtilityBill] = useState((user as any)?.utilityBill || "");
  const [businessCert, setBusinessCert] = useState<string | null>(null);
  const [tier, setTier] = useState(user?.tier || 1);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File, type: string) => {
    if (!user) return;
    try {
      const url = await storageService.uploadFile(`business/${user.id}/${type}_${Date.now()}`, file);
      if (type === 'cert') setBusinessCert(url);
      toast.success(`${type} uploaded successfully`);
    } catch (e) {
      toast.error("File upload failed");
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      if (tier === 1) {
        await paystackService.verifyIdentity('bvn', bvn);
        await userService.updateProfile(user.id, { isVerified: true, tier: 2, bvn, nin });
        setIsSuccess(true);
        toast.success("Identity Verified! Level 2 reached.");
      } else {
        await userService.updateProfile(user.id, { tier: 3, utilityBill, businessCert });
        setIsSuccess(true);
        toast.success("Business Fully Verified! Level 3 reached.");
      }
      if (onRefresh) onRefresh();
      setTimeout(() => navigate("/profile"), 2000);
    } catch (e: any) {
      toast.error("Verification Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 py-4 px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-black">Business Verification</h2>
      </div>
      <Card className="border-none shadow-xl bg-slate-50 p-6 rounded-[2rem] text-foreground">
        <div className="space-y-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {tier === 1 ? "Step 1: Director Identity" : "Step 2: Business Registration"}
          </p>

          {tier === 1 ? (
            <div className="space-y-4">
              <input value={bvn} onChange={e => setBvn(e.target.value)} placeholder="Director BVN" className="w-full p-4 border-2 rounded-2xl" />
              <input value={nin} onChange={e => setNin(e.target.value)} placeholder="Director NIN" className="w-full p-4 border-2 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-4">
              <input value={utilityBill} onChange={e => setUtilityBill(e.target.value)} placeholder="Business Address Utility Bill" className="w-full p-4 border-2 rounded-2xl" />
              <div className="p-4 border-2 border-dashed rounded-2xl bg-white text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Upload CAC Certificate / Incorporation Docs</p>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cert')}
                  className="text-xs"
                />
                {businessCert && <p className="text-sky-600 text-[10px] font-bold mt-2">Document Attached ✓</p>}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {[1,2,3].map(t => (
              <div key={t} className={`flex gap-4 items-center p-3 bg-white rounded-2xl border-2 ${user && user.tier >= t ? 'border-sky-500' : 'border-slate-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${user && user.tier >= t ? 'bg-sky-500 text-white' : 'bg-slate-200'}`}>{t}</div>
                <div><p className="font-black text-xs">Level {t} {t === 3 ? '(Corporate)' : ''}</p></div>
                {user && user.tier >= t && <CheckCircle2 className="w-4 h-4 text-sky-500 ml-auto" />}
              </div>
            ))}
          </div>

          {isSuccess ? (
            <div className="p-4 bg-sky-500 text-white rounded-2xl text-center font-black animate-bounce">Verification Submitted!</div>
          ) : (
            <Button className="w-full h-16 rounded-[1.5rem] font-black mt-4 shadow-xl" onClick={handleVerify} disabled={isProcessing || tier >= 3}>
              {isProcessing ? "Processing Docs..." : `Upgrade to Level ${tier + 1}`}
            </Button>
          )}
        </div>
      </Card>
      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <p className="text-[10px] text-blue-800 font-medium">Business accounts require Level 3 verification to access higher transfer limits and corporate tax features.</p>
        </div>
      </div>
    </div>
  );
}
