import { describe, expect, it } from "vitest";
import { countByStatus, dailyRevenueSeries, percentChange, totalRevenue, type OrderForStats } from "@/lib/stats";

const orders: OrderForStats[] = [
  { total: 100, status: "delivered", createdAt: new Date("2026-10-20T10:00:00Z") },
  { total: 50, status: "pending", createdAt: new Date("2026-10-21T10:00:00Z") },
  { total: 200, status: "cancelled", createdAt: new Date("2026-10-21T12:00:00Z") },
];

describe("totalRevenue", () => {
  it("sums non-cancelled orders", () => {
    expect(totalRevenue(orders)).toBe(150);
  });
  it("returns 0 for an empty list", () => {
    expect(totalRevenue([])).toBe(0);
  });
});

describe("countByStatus", () => {
  it("groups orders by status", () => {
    expect(countByStatus(orders)).toEqual({ delivered: 1, pending: 1, cancelled: 1 });
  });
});

describe("dailyRevenueSeries", () => {
  it("returns a contiguous series with zeros for quiet days", () => {
    const now = new Date("2026-10-22T15:00:00Z");
    const series = dailyRevenueSeries(orders, 5, now);
    expect(series).toHaveLength(5);
    expect(series.map((p) => p.date)).toEqual(["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"]);
    expect(series[2].revenue).toBe(100);
    expect(series[3].revenue).toBe(50); // cancelled order excluded
    expect(series[3].orders).toBe(1);
    expect(series[0].revenue).toBe(0);
  });
});

describe("percentChange", () => {
  it("computes percentage deltas", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });
  it("returns null when the previous period was zero", () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});
