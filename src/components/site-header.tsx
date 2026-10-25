import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="text-sm font-medium">{title}</h1>
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}
