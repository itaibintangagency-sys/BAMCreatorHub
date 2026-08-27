import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";
import { tandaiSelesai } from "../actions";

export default async function TutorialDetailPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();

  const { data: tutorial } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", params.id)
    .single();

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

  if (!tutorial) return null;

  return (
    <>
      <Topbar title={tutorial.title} profile={profile} />
      <div className="p-7 grid grid-cols-[1fr_320px] gap-6 items-start">
        <div>
          <h2 className="text-xl font-extrabold mb-2">{tutorial.title}</h2>
          <p className="text-[13.5px] leading-7">{tutorial.description}</p>
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
          {materials?.map((m) => {
            const isDone = doneIds.has(m.id);
            return (
              <form key={m.id} action={tandaiSelesai.bind(null, m.id, tutorial.id)}>
                <button
                  type="submit"
                  disabled={isDone}
                  className="w-full flex items-center gap-2.5 px-4.5 py-3 border-b border-line last:border-0 text-left hover:bg-gray-50"
                >
                  <span
                    className={`w-[19px] h-[19px] rounded-full border-2 flex-shrink-0 ${
                      isDone ? "bg-green-600 border-green-600" : "border-line"
                    }`}
                  />
                  <span className="text-[12.5px] font-medium">{m.type} — klik untuk tandai selesai</span>
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </>
  );
}
