import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: number | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {change !== undefined && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {change === null ? (
              <span>vs. previous 14 days</span>
            ) : (
              <>
                {change >= 0 ? (
                  <TrendingUp className={cn("h-3.5 w-3.5", "text-emerald-500")} />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={change >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {change >= 0 ? "+" : ""}
                  {change}%
                </span>
                <span>vs. previous 14 days</span>
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
