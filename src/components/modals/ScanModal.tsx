import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scanPayService } from "../../lib/services";
import { User } from "../../lib/types";

export default function ScanModal({ isOpen, onClose, user, onRefresh }: { isOpen: boolean, onClose: any, user: User | null, onRefresh: any }) {
  const [isScanning, setIsScanning] = useState(true);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    if (!user || !amount) return;
    setIsProcessing(true);
    try {
      await scanPayService.pay(user.id, { merchantId: "VIVA-MERCH-819", amount: parseFloat(amount), sender: user.accountNumber });
      toast.success("Paid!");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
            <Card className="shadow-2xl rounded-3xl">
              <CardHeader className="text-center">
                <CardTitle>Scan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                {isScanning ? (
                  <div className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/30">
                      <Camera className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                    <Button className="w-full" onClick={() => setIsScanning(false)}>Scan QR</Button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <h3 className="text-xl font-black">Viva Merchant</h3>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 border rounded-xl text-center text-2xl font-bold bg-background" />
                    <Button className="w-full h-12" onClick={handlePay} disabled={isProcessing}>Pay</Button>
                  </div>
                )}
                <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
