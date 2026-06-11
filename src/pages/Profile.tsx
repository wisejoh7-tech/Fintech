import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Camera,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Zap,
  Info,
  LogOut
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { toast } from "sonner";
import { User } from "../lib/types";

function ProfileItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-xl border bg-white hover:bg-slate-50 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">{icon}</div>
        <span className="font-bold">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}

export default function Profile({ user, setIsUpgradeOpen, setIsSecurityModalOpen, setIsEditProfileOpen }: { user: User | null, setIsUpgradeOpen: any, setIsSecurityModalOpen: any, setIsEditProfileOpen: any }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden group-hover:border-primary transition-colors">
            {user?.avatar ? <img src={user.avatar} alt="P" className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-primary" />}
          </div>
          <button onClick={() => setIsEditProfileOpen(true)} className="absolute bottom-0 right-0 p-1.5 bg-sky-500 text-white rounded-full border-2 border-background shadow-lg scale-90 group-hover:scale-100 transition-transform"><Camera className="w-3 h-3" /></button>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <p className="text-muted-foreground text-sm font-medium">{user?.phoneNumber}</p>
          <p className="text-muted-foreground text-xs opacity-70">Acc: {user?.accountNumber}</p>
          <div className="flex gap-2 mt-3 justify-center">
            <Badge variant={user?.isVerified ? "default" : "secondary"}>
              {user?.isVerified ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
              {user?.isVerified ? 'Verified' : 'Unverified'}
            </Badge>
            <Badge variant="outline" className="border-primary text-primary">Tier {user?.tier || 1}</Badge>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <ProfileItem icon={<UserIcon />} label="Edit Profile & Address" onClick={() => setIsEditProfileOpen(true)} />
        <ProfileItem icon={<FileCheck />} label="KYC (BVN/NIN Verification)" onClick={() => navigate("/kyc")} />
        <ProfileItem icon={<ShieldCheck />} label="Security Center" onClick={() => setIsSecurityModalOpen(true)} />
        <ProfileItem icon={<Zap />} label="Upgrade Account Tier" onClick={() => setIsUpgradeOpen(true)} />
        <ProfileItem icon={<Info />} label="Help Center" onClick={() => toast.info("Help Center: 08183793358")} />
        <Button variant="destructive" className="w-full mt-6 h-12 rounded-xl font-bold" onClick={() => signOut(auth)}>
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </div>
    </div>
  );
}
