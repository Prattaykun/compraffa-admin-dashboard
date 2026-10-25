"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--color-primary, #6366f1)" },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>Daily revenue over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v: string) =>
                new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={56}
              tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) =>
                    new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  }
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                />
              }
            />
            <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} fill="url(#revenueFill)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
