"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/lib/validators";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductRow | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>{product ? "Update this product's details." : "Create a new product for your store."}</DialogDescription>
        </DialogHeader>
        {/* Remounting on open/product change resets form state without an effect. */}
        {open && (
          <ProductForm
            key={product?.id ?? "new"}
            product={product ?? null}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  onCancel,
  onSaved,
}: {
  product: ProductRow | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = product !== null;
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(product?.category ?? PRODUCT_CATEGORIES[0]);
  const [status, setStatus] = useState<string>(product?.status ?? "active");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      sku: form.get("sku"),
      category,
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      status,
    };

    startTransition(async () => {
      const res = await fetch(isEdit ? `/api/products/${product.id}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save the product.");
        return;
      }
      toast.success(isEdit ? "Product updated" : "Product created");
      onSaved();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={product?.name} required minLength={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku} required minLength={3} className="uppercase" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => v !== null && setCategory(v)}>
            <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0.01" defaultValue={product?.price} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => v !== null && setStatus(v)}>
          <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </DialogFooter>
    </form>
  );
}
