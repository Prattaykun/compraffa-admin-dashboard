import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: user.name, email: user.email }} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}