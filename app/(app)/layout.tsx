import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login/internal");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="ml-56 flex-1 min-w-0">{children}</div>
    </div>
  );
}
