import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  TrendingUp,
  Smartphone
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rewardService } from "../lib/services";

export default function RewardsHub({ balance, onRefresh }: { balance: number, onRefresh: any }) {
  const navigate = useNavigate();
  const [refCode, setRefCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await rewardService.applyReferral(refCode);
      toast.success("Bonus claimed!");
      onRefresh();
      setRefCode("");
    } catch (e: any) {
      toast.error(e.message || "Invalid code");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background">
      <div className="max-w-md mx-auto h-full flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-slate-100"><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-xl font-black">Rewards Hub</h2>
        </div>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Cash Earned</p>
          <h2 className="text-4xl font-black mt-2">₦{balance.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 bg-white/20 w-fit px-4 py-2 rounded-full border border-white/20">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">0.5% Cashback active</span>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Claim Referral Bonus</h3>
            <div className="flex gap-2">
              <input
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="Enter referral code"
                className="flex-1 p-4 border-2 rounded-2xl bg-white outline-none focus:border-emerald-500 font-bold"
              />
              <Button onClick={handleApply} disabled={isApplying || !refCode} className="h-14 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
                {isApplying ? "..." : "Claim"}
              </Button>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Smartphone className="text-emerald-600" />
              </div>
              <div>
                <p className="font-black text-sm">Convert to Airtime</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Instant payout to your phone</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl font-bold border-emerald-100 text-emerald-700 hover:bg-emerald-50">Redeem Rewards</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
