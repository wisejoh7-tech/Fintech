import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Smartphone,
  Lock,
  Bell,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userService } from "../lib/services";
import { User } from "../lib/types";

export default function AccountSettings({ user, onRefresh }: { user: User | null, onRefresh: any }) {
  const [is2FA, setIs2FA] = useState(false);
  const [isBio, setIsBio] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setIs2FA(user.is2FAEnabled ?? false);
      setIsBio(user.isBiometricEnabled ?? false);
      setNotifications(localStorage.getItem("viva_notifications") !== "false");
      setPrivacy(localStorage.getItem("viva_privacy_mode") === "true");
    }
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await userService.updateProfile(user.id, { is2FAEnabled: is2FA, isBiometricEnabled: isBio });
      localStorage.setItem("viva_notifications", notifications.toString());
      localStorage.setItem("viva_privacy_mode", privacy.toString());
      toast.success("Saved!");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const Toggle = ({ checked, onChange, color }: any) => (
    <div onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${checked ? color || 'bg-sky-500' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${checked ? 'left-7' : 'left-1'}`} />
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-6 space-y-6 px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full bg-slate-100"><ChevronLeft className="w-5 h-5" /></Button>
        <h2 className="text-xl font-black">Settings</h2>
      </div>
      <Card className="rounded-[2rem] border-none shadow-2xl bg-white">
        <CardContent className="p-2">
          <div className="space-y-1">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Smartphone className="w-5 h-5 text-sky-600" />
                <div><p className="text-sm font-black">Biometrics</p></div>
              </div>
              <Toggle checked={isBio} onChange={setIsBio} />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-sky-600" />
                <div><p className="text-sm font-black">Two-Factor</p></div>
              </div>
              <Toggle checked={is2FA} onChange={setIs2FA} color="bg-sky-600" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-orange-600" />
                <div><p className="text-sm font-black">Notifications</p></div>
              </div>
              <Toggle checked={notifications} onChange={setNotifications} color="bg-orange-500" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <div><p className="text-sm font-black">Privacy</p></div>
              </div>
              <Toggle checked={privacy} onChange={setPrivacy} color="bg-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" onClick={saveSettings} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
