import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-[rgb(245_158_11/0.4)]",
  paid: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-[rgb(14_165_233/0.4)]",
  shipped: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-[rgb(139_92_246/0.4)]",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-[rgb(16_185_129/0.4)]",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400 border-[rgb(239_68_68/0.4)]",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-[rgb(16_185_129/0.4)]",
  draft: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-[rgb(113_113_122/0.4)]",
  archived: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-[rgb(249_115_22/0.4)]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", styles[status])}>
      {status}
    </Badge>
  );
}
