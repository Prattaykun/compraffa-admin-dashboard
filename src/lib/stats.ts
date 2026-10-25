export interface OrderForStats {
  total: number;
  status: string;
  createdAt: Date;
}

export interface DailyRevenuePoint {
  date: string; // ISO yyyy-mm-dd
  revenue: number;
  orders: number;
}

/** Sums revenue for orders that count toward revenue (not cancelled). */
export function totalRevenue(orders: OrderForStats[]): number {
  return round2(
    orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0),
  );
}

export function countByStatus(orders: OrderForStats[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const order of orders) counts[order.status] = (counts[order.status] ?? 0) + 1;
  return counts;
}

/** Builds a contiguous day-by-day revenue series for the last `days` days (oldest first). */
export function dailyRevenueSeries(orders: OrderForStats[], days: number, now = new Date()): DailyRevenuePoint[] {
  // Bucket in UTC so the series is stable regardless of server timezone.
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const buckets = new Map<string, DailyRevenuePoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(todayUtc - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue = round2(bucket.revenue + order.total);
      bucket.orders += 1;
    }
  }

  return [...buckets.values()];
}

/** Percentage change between two numbers; null when the previous value is 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return round2(((current - previous) / previous) * 100);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
