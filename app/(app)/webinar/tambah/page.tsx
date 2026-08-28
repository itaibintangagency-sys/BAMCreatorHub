import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import WebinarForm from "./WebinarForm";

export default async function TambahWebinarPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role === "creator") redirect("/webinar");

  const supabase = createClient();

  const [{ data: categories }, { data: creators }] = await Promise.all([
    supabase.from("webinar_categories").select("name, color").order("sort_order"),
    supabase.from("creators").select("id, nama, creator_code").order("nama"),
  ]);

  return (
    <>
      <Topbar title="Tambah Webinar" profile={profile} />
      <WebinarForm categories={categories ?? []} creators={creators ?? []} />
    </>
  );
}
