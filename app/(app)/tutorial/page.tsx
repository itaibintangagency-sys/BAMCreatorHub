import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";
import TutorialLibrary, { type TutorialItem } from "./TutorialLibrary";

export default async function TutorialPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();
  const isInternal = profile.role !== "creator";
  const isCreator = profile.role === "creator";

  const [{ data: tutorialsRaw }, { data: categories }, { data: allMaterials }] = await Promise.all([
    supabase.from("tutorials").select("*").order("last_updated", { ascending: false }),
    supabase.from("tutorial_categories").select("name, color").order("sort_order"),
    supabase.from("tutorial_materials").select("id, tutorial_id, type, content_url, order_index"),
  ]);

  // Thumbnail: ambil dari materi bertipe "video" PERTAMA (berdasarkan
  // order_index) di tiap tutorial, kalau link-nya Google Drive. Tidak
  // butuh kolom/upload gambar terpisah — thumbnail-nya dari Drive langsung.
  function extractDriveThumbnail(url: string | null): string | null {
    if (!url) return null;
    const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (!match) return null;
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
  }

  const materialsByTutorial: Record<string, typeof allMaterials> = {};
  for (const m of allMaterials ?? []) {
    (materialsByTutorial[m.tutorial_id] ??= []).push(m);
  }
  const thumbnailByTutorial: Record<string, string | null> = {};
  for (const [tid, mats] of Object.entries(materialsByTutorial)) {
    const sorted = [...(mats ?? [])].sort((a, b) => a.order_index - b.order_index);
    const firstVideo = sorted.find((m) => m.type === "video");
    thumbnailByTutorial[tid] = firstVideo ? extractDriveThumbnail(firstVideo.content_url) : null;
  }

  // Hitung jumlah materi per tutorial (utk status belum/sedang/selesai)
  const materialCountByTutorial: Record<string, number> = {};
  for (const m of allMaterials ?? []) {
    materialCountByTutorial[m.tutorial_id] = (materialCountByTutorial[m.tutorial_id] ?? 0) + 1;
  }

  let doneCountByTutorial: Record<string, number> = {};
  if (isCreator) {
    const materialIds = (allMaterials ?? []).map((m) => m.id);
    if (materialIds.length > 0) {
      const { data: progress } = await supabase
        .from("tutorial_progress")
        .select("material_id, status")
        .eq("creator_id", profile.id)
        .eq("status", "selesai")
        .in("material_id", materialIds);

      const materialToTutorial: Record<string, string> = {};
      for (const m of allMaterials ?? []) materialToTutorial[m.id] = m.tutorial_id;

      for (const p of progress ?? []) {
        const tid = materialToTutorial[p.material_id];
        if (tid) doneCountByTutorial[tid] = (doneCountByTutorial[tid] ?? 0) + 1;
      }
    }
  }

  function computeStatus(tutorialId: string): TutorialItem["status"] {
    const total = materialCountByTutorial[tutorialId] ?? 0;
    if (total === 0) return "tanpa_materi";
    if (!isCreator) return "tanpa_materi"; // internal tidak punya progress personal
    const done = doneCountByTutorial[tutorialId] ?? 0;
    if (done === 0) return "belum";
    if (done < total) return "sedang";
    return "selesai";
  }

  const tutorials: TutorialItem[] = (tutorialsRaw ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    level: t.level,
    description: t.description,
    is_onboarding_required: t.is_onboarding_required,
    order_in_path: t.order_in_path,
    last_updated: t.last_updated,
    status: computeStatus(t.id),
    thumbnail_url: thumbnailByTutorial[t.id] ?? null,
  }));

  return (
    <>
      <Topbar title="Tutorial" profile={profile} />
      <div className="p-4 md:p-7">
        <div className="flex justify-end mb-4">
          {isInternal && (
            <Link
              href="/tutorial/tambah"
              className="bg-orange text-white text-[13.5px] font-medium px-4 py-2 rounded-md whitespace-nowrap"
            >
              + Tambah Tutorial
            </Link>
          )}
        </div>

        <TutorialLibrary
          tutorials={tutorials}
          categories={categories ?? []}
          isCreator={isCreator}
          initialCategory={searchParams.category ?? null}
        />
      </div>
    </>
  );
}
