import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Lock,
  Send,
  Activity as ActivityIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { adminService } from "../lib/services";
import { User } from "../lib/types";

export default function AdminDashboard({ user }: { user: User | null }) {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsData = await adminService.getStats();
        const usersData = await adminService.getUsers();
        setStats(statsData);
        setUsers(usersData);
      } catch (err) {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-slate-100"><ChevronLeft className="w-5 h-5" /></Button>
          <h2 className="text-2xl font-black">Admin Command Center</h2>
        </div>
        <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-2">LIVE MONITORING</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-none shadow-sm bg-blue-50">
          <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Total Users</p>
          <h3 className="text-3xl font-black">{stats?.totalUsers || 0}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-purple-50">
          <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Total Tx</p>
          <h3 className="text-3xl font-black">{stats?.totalTransactions || 0}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-orange-50">
          <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Volume</p>
          <h3 className="text-3xl font-black">₦{(stats?.totalVolume || 0).toLocaleString()}</h3>
        </Card>
        <Card className="p-6 border-none shadow-sm bg-emerald-50">
          <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Security Score</p>
          <h3 className="text-3xl font-black">98%</h3>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-4">
          <TabsTrigger value="activity" className="rounded-lg font-bold px-6">Live Activity</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-bold px-6">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="border shadow-sm rounded-3xl overflow-hidden">
            <CardHeader><CardTitle className="text-lg">Recent System Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {stats?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {act.type === 'LOGIN' ? <Lock className="w-5 h-5" /> : act.type === 'TRANSFER_INITIATED' ? <Send className="w-5 h-5" /> : <ActivityIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-black">{act.detail}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{act.user?.name} • {new Date(act.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black">{act.ip}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Balance</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Risk</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            {u.avatar && <img src={u.avatar} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div><p className="text-sm font-bold">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="p-4 font-black text-sm">₦{(u.balance || 0).toLocaleString()}</td>
                      <td className="p-4"><Badge variant={u.riskLevel === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{u.riskLevel}</Badge></td>
                      <td className="p-4"><Badge className="bg-sky-500 text-[10px]">Tier {u.tier}</Badge></td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger><Button variant="ghost" size="sm" className="font-bold">Manage</Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => adminService.promoteToAdmin(u.id).then(() => toast.success("Promoted!"))}>Make Admin</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => adminService.updateRiskLevel(u.id, 'high').then(() => toast.success("Risk Updated!"))}>Mark High Risk</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Freeze Account</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
