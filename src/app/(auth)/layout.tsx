import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Zap } from "lucide-react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 p-4">
      {/* Decorative animated gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-delay:1.5s]" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Aurora Admin</span>
        </div>
        {children}
      </div>
    </div>
  );
}