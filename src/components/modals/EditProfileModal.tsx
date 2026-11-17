import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIcon, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userService, storageService } from "../../lib/services";
import { User } from "../../lib/types";

export default function EditProfileModal({ user, isOpen, onClose, onRefresh }: { user: User | null, isOpen: boolean, onClose: any, onRefresh: any }) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [address, setAddress] = useState((user as any)?.address || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phoneNumber || "");
    setAddress((user as any)?.address || "");
    setCapturedImage(user?.avatar || null);
  }, [user, isOpen]);

  const handleUpdate = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await userService.updateProfile(user.id, { name, phoneNumber: phone, address, avatar: capturedImage });
      toast.success("Profile updated!");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md my-8">
            <Card className="shadow-2xl border-primary/20">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
                    {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-10 h-10 text-muted-foreground opacity-30" />}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !user) return;
                        try {
                          const url = await storageService.uploadFile(`users/${user.id}/avatars/${Date.now()}`, file);
                          setCapturedImage(url);
                          toast.success("Photo uploaded!");
                        } catch (err) {
                          toast.error("Upload failed");
                        }
                      }} className="hidden" id="avatar-upload" />
                      <label htmlFor="avatar-upload" className="flex items-center h-8 px-3 text-xs font-medium border rounded-md cursor-pointer hover:bg-slate-50 transition-colors"><Plus className="w-3 h-3 mr-2" /> Upload Photo</label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full p-4 border rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-4 border rounded-xl bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Home Address</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full address" className="w-full p-4 border rounded-xl bg-background min-h-[100px]" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
