"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ORDER_STATUSES } from "@/lib/validators";
import { formatCurrency, formatDate } from "@/lib/format";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { name: string; email: string };
  items: { id: string; quantity: number; unitPrice: number; productId: string }[];
}

interface OrderDetail extends Omit<OrderRow, "items"> {
  items: { id: string; quantity: number; unitPrice: number; product: { name: string; sku: string } }[];
}

export default function OrdersPage() {
  const [result, setResult] = useState<{ key: string; items: OrderRow[]; total: number; pageSize: number } | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const queryKey = `${debouncedQ}|${status}|${page}|${refreshKey}`;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ q: debouncedQ, page: String(page) });
    if (status !== "all") params.set("status", status);
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (active)
          setResult({ key: queryKey, items: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 8 });
      });
    return () => {
      active = false;
    };
  }, [debouncedQ, page, status, refreshKey, queryKey]);

  // Loading while the displayed result does not match the current query.
  const loading = result === null || result.key !== queryKey;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pageSize = result?.pageSize ?? 8;
  const reload = () => setRefreshKey((k) => k + 1);

  async function openOrder(id: string) {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) {
      toast.error("Could not load the order.");
      return;
    }
    setSelected((await res.json()).order);
    setSheetOpen(true);
  }

  async function updateStatus(next: string) {
    if (!selected) return;
    setStatusBusy(true);
    const res = await fetch(`/api/orders/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatusBusy(false);
    if (!res.ok) {
      toast.error("Could not update the status.");
      return;
    }
    setSelected({ ...selected, status: next });
    toast.success(`Order marked ${next}`);
    reload();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <SiteHeader title="Orders" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order # or customer…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { if (v !== null) { setStatus(v); setPage(1); } }}>
            <SelectTrigger className="w-full sm:w-44 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                : items.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => openOrder(o.id)}>
                      <TableCell className="font-medium">{o.orderNumber}</TableCell>
                      <TableCell>
                        <p>{o.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{o.customer.email}</p>
                      </TableCell>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right">{o.items.reduce((s, it) => s + it.quantity, 0)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
                    </TableRow>
                  ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No orders found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} order{total === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  {selected.orderNumber} <StatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription>{formatDate(selected.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <div>
                  <h3 className="mb-1 text-sm font-medium">Customer</h3>
                  <p className="text-sm">{selected.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.customer.email}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-medium">Items</h3>
                  <div className="space-y-2">
                    {selected.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p>{it.product.name}</p>
                          <p className="text-xs text-muted-foreground">{it.product.sku} × {it.quantity}</p>
                        </div>
                        <span className="font-medium">{formatCurrency(it.unitPrice * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(selected.total)}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Update status</h3>
                  <Select value={selected.status} onValueChange={(v) => { if (v !== null) updateStatus(v); }} disabled={statusBusy}>
                    <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
