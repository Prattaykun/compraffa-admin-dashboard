import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/validators";

const PAGE_SIZE = 8;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q } },
            { customer: { name: { contains: q } } },
            { customer: { email: { contains: q } } },
          ],
        }
      : {}),
    ...(ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]) ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: { select: { name: true, email: true } }, items: true },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
}
