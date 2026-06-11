import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { staffService } from "../../lib/services";

export default function StaffModal({ isOpen, onClose }: { isOpen: boolean, onClose: any }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", role: "VIEWER" });

  useEffect(() => { if (isOpen) fetchStaff(); }, [isOpen]);

  const fetchStaff = async () => {
    try {
      const data = await staffService.getStaff();
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await staffService.addStaff(form);
      toast.success("Staff member invited!");
      setIsAddOpen(false);
      fetchStaff();
    } catch (e) {
      toast.error("Failed to add staff");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card className="shadow-2xl border-primary/20 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-black">Team Access</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {isAddOpen ? (
                  <div className="space-y-4">
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" className="w-full p-4 border-2 rounded-2xl" />
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Corporate Email" className="w-full p-4 border-2 rounded-2xl" />
                    <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full p-4 border-2 rounded-2xl bg-white">
                      <option value="VIEWER">Viewer (Read Only)</option>
                      <option value="INITIATOR">Initiator (Create Transfers)</option>
                      <option value="ADMIN">Co-Admin (Full Access)</option>
                    </select>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setIsAddOpen(false)}>Back</Button>
                      <Button className="flex-1" onClick={handleAdd}>Invite Staff</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button onClick={() => setIsAddOpen(true)} variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl font-bold"><Plus className="w-4 h-4 mr-2" /> Add Team Member</Button>
                    {loading ? <div className="py-10 text-center opacity-50 text-[10px] font-black uppercase">Loading...</div> : staff.map(s => (
                      <div key={s.id} className="p-4 border-2 rounded-2xl bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-black text-sm">{s.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.role}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[8px] font-black">{s.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
