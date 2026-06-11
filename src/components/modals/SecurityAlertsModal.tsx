import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SecurityAlertsModal({ isOpen, onClose, alerts }: { isOpen: boolean, onClose: any, alerts: any[] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20">
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {!alerts || alerts.length === 0 ? (
                  <p className="text-center py-10 opacity-50">No new alerts</p>
                ) : (
                  alerts.map((a: any) => (
                    <div key={a.id} className="p-3 border rounded-xl">
                      <p className="font-bold">{a.title}</p>
                      <p className="text-xs opacity-70">{a.message}</p>
                    </div>
                  ))
                )}
                <Button className="w-full" onClick={onClose}>Close</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
