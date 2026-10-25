import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { productSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.sku) {
    const clash = await prisma.product.findFirst({ where: { sku: parsed.data.sku.toUpperCase(), NOT: { id } } });
    if (clash) return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    parsed.data.sku = parsed.data.sku.toUpperCase();
  }

  const product = await prisma.product.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;

  const itemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: "This product appears in past orders. Archive it instead of deleting." },
      { status: 409 },
    );
  }

  await prisma.product.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
