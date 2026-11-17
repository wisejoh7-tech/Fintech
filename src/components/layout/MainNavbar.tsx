import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  User as UserIcon,
  UserCog,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { User } from "../../lib/types";

export default function MainNavbar({ user, securityAlerts, setIsAlertsOpen, setIsSecurityModalOpen, setIsEditProfileOpen }: { user: User | null, securityAlerts: any[], setIsAlertsOpen: any, setIsSecurityModalOpen: any, setIsEditProfileOpen: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md px-4 py-3 border-b pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {!isHome && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-1 rounded-full bg-secondary/10 text-secondary">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 overflow-hidden group-hover:border-primary transition-colors">
                  {user?.avatar ? <img src={user.avatar} alt="P" className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 m-2.5 text-primary" />}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Business Account 👋</p>
                  <p className="text-sm font-black text-foreground">{user?.name || "Company Name"}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 mt-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsEditProfileOpen(true)}><UserCog className="mr-2 h-4 w-4" />Edit Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}><UserIcon className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive font-bold"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setIsAlertsOpen(true)}><Bell className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => setIsSecurityModalOpen(true)}><ShieldCheck className="w-5 h-5 text-primary" /></Button>
        </div>
      </div>
    </nav>
  );
}
