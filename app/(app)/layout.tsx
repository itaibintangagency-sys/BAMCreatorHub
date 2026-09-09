import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login/internal");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar profile={profile} />
        <div className="flex-1 min-w-0 md:ml-56">{children}</div>
      </div>
    </SidebarProvider>
  );
}
