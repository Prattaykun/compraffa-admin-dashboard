"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

export default function CustomersPage() {
  const [result, setResult] = useState<{ key: string; items: CustomerRow[] } | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    fetch(`/api/customers?q=${encodeURIComponent(debouncedQ)}`)
      .then((r) => r.json())
      .then((data) => {
        if (active) setResult({ key: debouncedQ, items: data.items ?? [] });
      });
    return () => {
      active = false;
    };
  }, [debouncedQ]);

  // Loading while the displayed result does not match the current query.
  const loading = result === null || result.key !== debouncedQ;
  const items = result?.items ?? [];

  return (
    <>
      <SiteHeader title="Customers" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                : items.map((c) => {
                    const initials = c.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(c.createdAt)}</TableCell>
                        <TableCell className="text-right">{c.ordersCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(c.totalSpent)}</TableCell>
                      </TableRow>
                    );
                  })}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No customers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
