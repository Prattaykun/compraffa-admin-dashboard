import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { productSchema } from "@/lib/validators";

const PAGE_SIZE = 8;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const where = q
    ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { category: { contains: q } }] }
    : {};

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const sku = parsed.data.sku.toUpperCase();
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });

  const product = await prisma.product.create({ data: { ...parsed.data, sku } });
  return NextResponse.json({ product }, { status: 201 });
}
