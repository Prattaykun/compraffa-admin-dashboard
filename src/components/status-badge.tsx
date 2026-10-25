import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  paid: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
  shipped: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  draft: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
  archived: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", styles[status])}>
      {status}
    </Badge>
  );
}
