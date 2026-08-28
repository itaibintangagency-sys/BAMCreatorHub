import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";
import { tandaiSelesai } from "../actions";

// Google Drive share link -> embeddable preview URL. Format lain
// (bit.ly, halaman Shopee, dst) tidak bisa di-embed reliable,
// jadi fallback ke tombol "Buka materi" di tab baru.
function getEmbedUrl(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return null;
}

export default async function TutorialDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();

  const { data: tutorial } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!tutorial) return null;

  const { data: materials } = await supabase
    .from("tutorial_materials")
    .select("*")
    .eq("tutorial_id", params.id)
    .order("order_index");

  const { data: progress } =
    profile.role === "creator"
      ? await supabase
          .from("tutorial_progress")
          .select("material_id, status")
          .eq("creator_id", profile.id)
      : { data: [] };

  const doneIds = new Set((progress ?? []).filter((p) => p.status === "selesai").map((p) => p.material_id));
  const allDone = (materials ?? []).length > 0 && (materials ?? []).every((m) => doneIds.has(m.id));

  // Navigasi "lanjut ke tutorial berikutnya" (khusus item onboarding)
  let nextTutorial: { id: string; title: string } | null = null;
  if (tutorial.is_onboarding_required) {
    const { data: nextItem } = await supabase
      .from("tutorials")
      .select("id, title")
      .eq("is_onboarding_required", true)
      .gt("order_in_path", tutorial.order_in_path ?? 0)
      .order("order_in_path")
      .limit(1)
      .maybeSingle();
    nextTutorial = nextItem;
  }

  const isRecentlyUpdated =
    (Date.now() - new Date(tutorial.last_updated).getTime()) / (1000 * 60 * 60 * 24) <= 14;

  const activeMaterial = (materials ?? []).find((m) => !doneIds.has(m.id)) ?? materials?.[0];
  const embedUrl = activeMaterial?.content_url ? getEmbedUrl(activeMaterial.content_url) : null;

  return (
    <>
      <Topbar title={tutorial.title} profile={profile} />
      <div className="p-7 grid grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4">
          <div>
            <div className="flex gap-1.5 mb-2 flex-wrap items-center">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-light text-orange-dark">
                {tutorial.category}
              </span>
              {tutorial.level && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-ink-soft">
                  {tutorial.level}
                </span>
              )}
              {isRecentlyUpdated && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  Baru diperbarui
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold mb-2">{tutorial.title}</h2>
            <p className="text-[13.5px] leading-7 text-ink-soft">{tutorial.description}</p>
          </div>

          {/* Preview materi aktif */}
          {activeMaterial && (
            <div className="bg-white border border-line rounded-md overflow-hidden">
              {embedUrl ? (
                <iframe src={embedUrl} className="w-full aspect-video" allow="autoplay" />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-ink-soft mb-3">
                    Materi ini tidak bisa ditampilkan langsung di sini.
                  </p>
                  <a
                    href={activeMaterial.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-orange text-white text-sm font-medium px-4 py-2 rounded-md"
                  >
                    Buka materi
                  </a>
                </div>
              )}
            </div>
          )}

          {allDone && nextTutorial && (
            <Link
              href={`/tutorial/${nextTutorial.id}`}
              className="block bg-green-50 border border-green-200 rounded-md p-4 hover:bg-green-100"
            >
              <div className="text-[11.5px] text-green-700 font-medium mb-0.5">Tutorial selesai!</div>
              <div className="text-[13.5px] font-semibold">Lanjut ke: {nextTutorial.title} &rarr;</div>
            </Link>
          )}
        </div>

        <div className="bg-white border border-line rounded-md">
          <div className="px-4.5 pt-4 pb-3 border-b border-line">
            <div className="flex justify-between text-[13.5px] font-bold mb-2">
              <span>Materi</span>
              <span className="text-[11.5px] text-ink-soft font-normal">
                {doneIds.size}/{materials?.length ?? 0} selesai
              </span>
            </div>
          </div>
          {materials?.map((m, i) => {
            const isDone = doneIds.has(m.id);
            return (
              <form key={m.id} action={tandaiSelesai.bind(null, m.id, tutorial.id)}>
                <button
                  type="submit"
                  disabled={isDone || profile.role !== "creator"}
                  className="w-full flex items-center gap-2.5 px-4.5 py-3 border-b border-line last:border-0 text-left hover:bg-gray-50 disabled:hover:bg-white"
                >
                  <span
                    className={`w-[19px] h-[19px] rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] text-white ${
                      isDone ? "bg-green-600 border-green-600" : "border-line"
                    }`}
                  >
                    {isDone ? "\u2713" : ""}
                  </span>
                  <span className="text-[12.5px] font-medium">
                    {i + 1}. {materialTypeLabel(m.type)}
                    {profile.role === "creator" && !isDone && (
                      <span className="text-ink-soft"> — klik untuk tandai selesai</span>
                    )}
                  </span>
                </button>
              </form>
            );
          })}
          {(!materials || materials.length === 0) && (
            <p className="p-4 text-xs text-ink-soft">Belum ada materi untuk tutorial ini.</p>
          )}
        </div>
      </div>
    </>
  );
}

function materialTypeLabel(type: string) {
  if (type === "video") return "Video";
  if (type === "reading") return "Bacaan";
  if (type === "quiz") return "Quiz";
  return type;
}
