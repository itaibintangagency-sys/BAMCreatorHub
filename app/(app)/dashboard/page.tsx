import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();

  // ============================================================
  // CREATOR: rekomendasi produk + widget "Lanjutkan Belajar"
  // ============================================================
  if (profile.role === "creator") {
    const [{ data: products }, { data: onboardingTutorials }] = await Promise.all([
      supabase.from("products").select("*").order("is_featured", { ascending: false }).limit(3),
      supabase
        .from("tutorials")
        .select("id, title, order_in_path")
        .eq("is_onboarding_required", true)
        .order("order_in_path"),
    ]);

    let continueTutorial: { id: string; title: string; done: number; total: number } | null = null;
    let allOnboardingDone = false;

    if (onboardingTutorials && onboardingTutorials.length > 0) {
      const tutorialIds = onboardingTutorials.map((t) => t.id);
      const { data: materials } = await supabase
        .from("tutorial_materials")
        .select("id, tutorial_id")
        .in("tutorial_id", tutorialIds);

      const materialIds = (materials ?? []).map((m) => m.id);
      const { data: progress } =
        materialIds.length > 0
          ? await supabase
              .from("tutorial_progress")
              .select("material_id")
              .eq("creator_id", profile.id)
              .eq("status", "selesai")
              .in("material_id", materialIds)
          : { data: [] };

      const doneMaterialIds = new Set((progress ?? []).map((p) => p.material_id));

      const totalByTutorial: Record<string, number> = {};
      const doneByTutorial: Record<string, number> = {};
      for (const m of materials ?? []) {
        totalByTutorial[m.tutorial_id] = (totalByTutorial[m.tutorial_id] ?? 0) + 1;
        if (doneMaterialIds.has(m.id)) {
          doneByTutorial[m.tutorial_id] = (doneByTutorial[m.tutorial_id] ?? 0) + 1;
        }
      }

      // Onboarding sudah diurutkan by order_in_path -> yang pertama BELUM
      // selesai itulah target "lanjutkan" (konsisten dengan logika locked
      // di TutorialLibrary.tsx: harus urut, tidak bisa loncat)
      const next = onboardingTutorials.find((t) => {
        const total = totalByTutorial[t.id] ?? 0;
        const done = doneByTutorial[t.id] ?? 0;
        return total === 0 || done < total;
      });

      if (next) {
        continueTutorial = {
          id: next.id,
          title: next.title,
          done: doneByTutorial[next.id] ?? 0,
          total: totalByTutorial[next.id] ?? 0,
        };
      } else {
        allOnboardingDone = true;
      }
    }

    return (
      <>
        <Topbar title="Dashboard" profile={profile} />
        <div className="p-4 md:p-7 space-y-7">
          {continueTutorial && (
            <div>
              <h2 className="text-[15.5px] font-bold mb-3.5">Lanjutkan Belajar</h2>
              <Link
                href={`/tutorial/${continueTutorial.id}`}
                className="block bg-white border border-line rounded-md p-4 hover:border-orange transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11.5px] text-ink-soft mb-1">Onboarding path</div>
                    <div className="font-semibold text-[14.5px] truncate">{continueTutorial.title}</div>
                    {continueTutorial.total > 0 && (
                      <div className="flex items-center gap-2 mt-2 max-w-xs">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange rounded-full"
                            style={{
                              width: `${Math.round((continueTutorial.done / continueTutorial.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-ink-soft flex-shrink-0">
                          {continueTutorial.done}/{continueTutorial.total}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 bg-orange text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-md whitespace-nowrap">
                    {continueTutorial.done > 0 ? "Lanjutkan" : "Mulai"} &rarr;
                  </span>
                </div>
              </Link>
            </div>
          )}

          {allOnboardingDone && !continueTutorial && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[13.5px] text-green-800">
                  Onboarding path kamu sudah selesai semua! &#127881;
                </div>
                <div className="text-[12px] text-green-700 mt-0.5">
                  Jelajahi tutorial lain untuk terus kembangkan skill kamu.
                </div>
              </div>
              <Link
                href="/tutorial"
                className="flex-shrink-0 bg-white border border-green-300 text-green-800 text-[12.5px] font-semibold px-3.5 py-2 rounded-md whitespace-nowrap"
              >
                Lihat Tutorial
              </Link>
            </div>
          )}

          <div>
            <h2 className="text-[15.5px] font-bold mb-3.5">Rekomendasi produk hari ini</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((p) => (
                <div key={p.id} className="border border-line rounded-md p-3 bg-white">
                  <div className="font-medium text-sm">{p.product_name}</div>
                  <div className="text-orange font-bold text-sm mt-1">{p.price_range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // SUPER ADMIN & CM: ringkasan Creator binaan + progress onboarding
  // ============================================================
  const creatorQuery = supabase.from("creators").select("id, nama, assigned_cm_id");
  const { data: creators } =
    profile.role === "cm"
      ? await creatorQuery.eq("assigned_cm_id", profile.id)
      : await creatorQuery;

  const { data: onboardingTutorials } = await supabase
    .from("tutorials")
    .select("id")
    .eq("is_onboarding_required", true);

  const onboardingIds = (onboardingTutorials ?? []).map((t) => t.id);

  let totalOnboardingMaterials = 0;
  const doneCountByCreator: Record<string, number> = {};

  if (onboardingIds.length > 0 && creators && creators.length > 0) {
    const { data: materials } = await supabase
      .from("tutorial_materials")
      .select("id")
      .in("tutorial_id", onboardingIds);

    const materialIds = (materials ?? []).map((m) => m.id);
    totalOnboardingMaterials = materialIds.length;

    if (materialIds.length > 0) {
      const creatorIds = creators.map((c) => c.id);
      const { data: progress } = await supabase
        .from("tutorial_progress")
        .select("creator_id, material_id")
        .eq("status", "selesai")
        .in("material_id", materialIds)
        .in("creator_id", creatorIds);

      for (const p of progress ?? []) {
        doneCountByCreator[p.creator_id] = (doneCountByCreator[p.creator_id] ?? 0) + 1;
      }
    }
  }

  return (
    <>
      <Topbar title="Dashboard" profile={profile} />
      <div className="p-4 md:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <StatCard label={profile.role === "cm" ? "Creator Saya" : "Total Creator"} value={creators?.length ?? 0} />
          <StatCard label="Produk Aktif" value="—" />
          <StatCard label="Webinar Bulan Ini" value="—" />
        </div>

        <div className="bg-white border border-line rounded-md">
          <h2 className="text-[15.5px] font-bold px-5 pt-4 pb-2">
            {profile.role === "cm" ? "Creator binaan saya" : "Semua Creator"}
          </h2>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-[11.5px] text-gray-400 uppercase">
                <th className="text-left px-4 py-2.5 border-b border-line">Nama Creator</th>
                {totalOnboardingMaterials > 0 && (
                  <th className="text-left px-4 py-2.5 border-b border-line">Progress Onboarding</th>
                )}
              </tr>
            </thead>
            <tbody>
              {creators?.map((c) => {
                const done = doneCountByCreator[c.id] ?? 0;
                const percent =
                  totalOnboardingMaterials > 0 ? Math.round((done / totalOnboardingMaterials) * 100) : 0;
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 border-b border-line last:border-0">{c.nama}</td>
                    {totalOnboardingMaterials > 0 && (
                      <td className="px-4 py-3 border-b border-line last:border-0">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent === 100 ? "bg-green-500" : percent === 0 ? "bg-gray-300" : "bg-amber-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-ink-soft flex-shrink-0 w-9">{percent}%</span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-line rounded-md p-4">
      <div className="text-xs text-ink-soft mb-1.5">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
