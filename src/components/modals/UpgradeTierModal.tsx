import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userService } from "../../lib/services";
import { User } from "../../lib/types";

export default function UpgradeTierModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpgrade = async (tier: number) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await userService.updateProfile(user.id, { tier });
      toast.success(`Upgraded to Tier ${tier} successfully!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Upgrade failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-xl font-black">Upgrade Account</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Increase limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <button onClick={() => handleUpgrade(2)} disabled={isSubmitting || (user?.tier || 1) >= 2} className={`w-full p-5 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${(user?.tier || 1) >= 2 ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-primary/30 hover:bg-primary/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">2</div>
                    <div><p className="font-black text-sm">Tier 2 (Standard)</p><p className="text-[10px] font-bold text-muted-foreground uppercase">Limit: ₦1,000,000</p></div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => handleUpgrade(3)} disabled={isSubmitting || (user?.tier || 1) >= 3} className={`w-full p-5 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${(user?.tier || 1) >= 3 ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-primary/30 hover:bg-primary/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black">3</div>
                    <div><p className="font-black text-sm">Tier 3 (Ultimate)</p><p className="text-[10px] font-bold text-muted-foreground uppercase">Limit: ₦10,000,000</p></div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t pt-4">
                <Button variant="ghost" className="w-full font-black uppercase text-[10px] tracking-widest" onClick={onClose}>Keep current</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
