import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import TutorialForm from "../../tambah/TutorialForm";

export default async function EditTutorialPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role === "creator") redirect(`/tutorial/${params.id}`);

  const supabase = createClient();

  const { data: tutorial } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!tutorial) redirect("/tutorial");

  const { data: materials } = await supabase
    .from("tutorial_materials")
    .select("id, type, content_url")
    .eq("tutorial_id", params.id)
    .order("order_index");

  const { data: categories } = await supabase
    .from("tutorial_categories")
    .select("name, color")
    .order("sort_order");

  return (
    <>
      <Topbar title={`Edit: ${tutorial.title}`} profile={profile} />
      <TutorialForm
        categories={categories ?? []}
        mode="edit"
        tutorialId={tutorial.id}
        initialValues={{
          title: tutorial.title,
          category: tutorial.category,
          level: tutorial.level,
          description: tutorial.description ?? "",
          visibility: tutorial.visibility ?? "all",
          is_onboarding_required: tutorial.is_onboarding_required ?? false,
          order_in_path: tutorial.order_in_path ?? null,
        }}
        initialMaterials={(materials ?? []).map((m) => ({
          id: m.id,
          type: m.type,
          url: m.content_url ?? "",
        }))}
      />
    </>
  );
}
