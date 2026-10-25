import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { name: string; email: string };
}

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest activity across your store</CardDescription>
        </div>
        <Link href="/dashboard/orders" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => {
          const initials = order.customer.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={order.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{order.customer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {order.orderNumber} · {formatDate(order.createdAt)}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <span className="w-20 text-right text-sm font-medium">{formatCurrency(order.total)}</span>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      </CardContent>
    </Card>
  );
}
