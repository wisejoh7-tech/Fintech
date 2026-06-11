import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiUrl } from "../../lib/api";

export default function USSDModal({ isOpen, onClose }: { isOpen: boolean, onClose: any }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isDialing, setIsDialing] = useState(false);

  const dial = async () => {
    setIsDialing(true);
    try {
      const res = await fetch(getApiUrl("/api/ussd/process"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: "+234 812 345 6789", text: input })
      });
      const text = await res.text();
      setResponse(text);
    } catch (e) {
      toast.error("USSD Network Error");
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[300px]">
            <div className="bg-[#2c2c2e] text-white p-6 rounded-3xl shadow-2xl font-sans">
              {response ? (
                <div className="space-y-6">
                  <p className="whitespace-pre-line text-sm leading-relaxed">{response.replace('CON ', '').replace('END ', '')}</p>
                  <div className="flex gap-2">
                    {response.startsWith('CON') && (
                      <input
                        className="flex-1 bg-transparent border-b border-white/20 p-1 text-white outline-none"
                        autoFocus
                      />
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-sky-400 font-bold"
                      onClick={() => { setResponse(null); setInput(""); onClose(); }}
                    >
                      {response.startsWith('CON') ? 'Send' : 'OK'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="*819#"
                    className="w-full bg-transparent border-b border-white/20 p-2 text-center text-2xl font-bold text-white outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1 text-white/40" onClick={onClose}>Cancel</Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                      onClick={dial}
                      disabled={isDialing || !input}
                    >
                      {isDialing ? "..." : "Dial"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
