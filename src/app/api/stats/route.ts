import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { countByStatus, dailyRevenueSeries, percentChange, totalRevenue } from "@/lib/stats";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 86400000);

  const [allOrders, recentWindowOrders, previousWindowOrders, productsCount, customersCount, recentOrders, topItems, lowStock] =
    await Promise.all([
      prisma.order.findMany({ select: { total: true, status: true, createdAt: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: fourteenDaysAgo } }, select: { total: true, status: true, createdAt: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: twentyEightDaysAgo, lt: fourteenDaysAgo } }, select: { total: true, status: true, createdAt: true } }),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { customer: { select: { name: true, email: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.product.findMany({ where: { stock: { lte: 10 } }, orderBy: { stock: "asc" }, take: 5 }),
    ]);

  const topProductIds = topItems.map((t) => t.productId);
  const topProductRows = await prisma.product.findMany({ where: { id: { in: topProductIds } } });
  const topProducts = topItems
    .map((t) => {
      const product = topProductRows.find((p) => p.id === t.productId);
      return product ? { id: product.id, name: product.name, category: product.category, price: product.price, unitsSold: t._sum.quantity ?? 0 } : null;
    })
    .filter(Boolean);

  return NextResponse.json({
    totals: {
      revenue: totalRevenue(allOrders),
      orders: allOrders.length,
      customers: customersCount,
      products: productsCount,
      revenueChange: percentChange(totalRevenue(recentWindowOrders), totalRevenue(previousWindowOrders)),
      ordersChange: percentChange(
        recentWindowOrders.filter((o) => o.status !== "cancelled").length,
        previousWindowOrders.filter((o) => o.status !== "cancelled").length,
      ),
    },
    statusBreakdown: countByStatus(allOrders),
    revenueSeries: dailyRevenueSeries(allOrders, 14, now),
    recentOrders,
    topProducts,
    lowStock,
  });
}
