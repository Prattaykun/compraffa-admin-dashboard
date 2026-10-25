import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    include: { orders: { select: { total: true, status: true } } },
  });

  return NextResponse.json({
    items: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt,
      ordersCount: c.orders.length,
      totalSpent: Math.round(c.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0) * 100) / 100,
    })),
  });
}
