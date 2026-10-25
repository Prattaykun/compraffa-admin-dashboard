"use client";

import { useEffect, useState } from "react";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import { RecentOrders, type RecentOrder } from "@/components/recent-orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

interface Stats {
  totals: { revenue: number; orders: number; customers: number; products: number; revenueChange: number | null; ordersChange: number | null };
  revenueSeries: { date: string; revenue: number; orders: number }[];
  recentOrders: RecentOrder[];
  topProducts: { id: string; name: string; category: string; price: number; unitsSold: number }[];
  lowStock: { id: string; name: string; sku: string; stock: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <SiteHeader title="Overview" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats ? (
            <>
              <StatCard title="Total revenue" value={formatCurrency(stats.totals.revenue)} change={stats.totals.revenueChange} icon={DollarSign} />
              <StatCard title="Orders" value={String(stats.totals.orders)} change={stats.totals.ordersChange} icon={ShoppingCart} />
              <StatCard title="Customers" value={String(stats.totals.customers)} icon={Users} />
              <StatCard title="Products" value={String(stats.totals.products)} icon={Package} />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            {stats ? <RevenueChart data={stats.revenueSeries} /> : <Skeleton className="h-96 rounded-xl" />}
          </div>
          <div className="min-w-0 lg:col-span-2">
            {stats ? <RecentOrders orders={stats.recentOrders} /> : <Skeleton className="h-96 rounded-xl" />}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top products</CardTitle>
              <CardDescription>By units sold</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats
                ? stats.topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                      </div>
                      <span className="text-sm font-medium">{p.unitsSold} sold</span>
                    </div>
                  ))
                : Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Products at or below 10 units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats ? (
                stats.lowStock.length > 0 ? (
                  stats.lowStock.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                      <span className={`text-sm font-semibold ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`}>
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">All products are well stocked.</p>
                )
              ) : (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
