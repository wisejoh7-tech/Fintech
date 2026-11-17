import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  History as HistoryIcon,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Transaction } from "../lib/types";

export default function HistoryView({ user, transactions }: { user: User | null, transactions: Transaction[] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const categories = ["All", "Transfer", "Deposit", "Bill", "Airtime"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: Transaction) => {
      const matchesSearch =
        (tx.receiver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesFilter = activeFilter === "All" || tx.type.toLowerCase() === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchQuery, activeFilter]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-black">Transaction History</h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeFilter === cat
                ? "bg-primary text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-0 divide-y">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                <HistoryIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-600'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm truncate max-w-[200px]">{tx.receiver === user?.accountNumber ? tx.sender : tx.receiver}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">{new Date(tx.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'deposit' ? 'text-sky-600' : 'text-slate-900'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{tx.status || 'Success'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
