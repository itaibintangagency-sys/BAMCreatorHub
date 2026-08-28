import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import TutorialForm from "./TutorialForm";

export default async function TambahTutorialPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role === "creator") redirect("/tutorial");

  const supabase = createClient();
  const { data: categories } = await supabase
    .from("tutorial_categories")
    .select("name, color")
    .order("sort_order");

  return (
    <>
      <Topbar title="Tambah Tutorial" profile={profile} />
      <TutorialForm categories={categories ?? []} />
    </>
  );
}
