"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { ProductFormDialog, type ProductRow } from "@/components/product-form-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";

export default function ProductsPage() {
  const [result, setResult] = useState<{ key: string; items: ProductRow[]; total: number; pageSize: number } | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const queryKey = `${debouncedQ}|${page}|${refreshKey}`;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    fetch(`/api/products?q=${encodeURIComponent(debouncedQ)}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        if (active)
          setResult({ key: queryKey, items: data.items ?? [], total: data.total ?? 0, pageSize: data.pageSize ?? 8 });
      });
    return () => {
      active = false;
    };
  }, [debouncedQ, page, refreshKey, queryKey]);

  // Loading while the displayed result does not match the current query.
  const loading = result === null || result.key !== queryKey;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pageSize = result?.pageSize ?? 8;
  const reload = () => setRefreshKey((k) => k + 1);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/products/${deleting.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleteBusy(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not delete the product.");
      return;
    }
    toast.success("Product deleted");
    setDeleting(null);
    reload();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <SiteHeader title="Products" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, SKU or category…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add product
          </Button>
        </div>

        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                : items.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="text-right">
                        <span className={p.stock === 0 ? "font-medium text-red-500" : p.stock <= 10 ? "font-medium text-amber-500" : ""}>
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} product{total === 1 ? "" : "s"}</span>
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

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} onSaved={reload} />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the product. Products referenced by past orders must be archived instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
