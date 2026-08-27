import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();

  if (profile.role === "creator") {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .order("is_featured", { ascending: false })
      .limit(3);

    return (
      <>
        <Topbar title="Dashboard" profile={profile} />
        <div className="p-7">
          <h2 className="text-[15.5px] font-bold mb-3.5">Rekomendasi produk hari ini</h2>
          <div className="grid grid-cols-3 gap-4">
            {products?.map((p) => (
              <div key={p.id} className="border border-line rounded-md p-3 bg-white">
                <div className="font-medium text-sm">{p.product_name}</div>
                <div className="text-orange font-bold text-sm mt-1">{p.price_range}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Super Admin & CM: lihat ringkasan Creator binaan
  const creatorQuery = supabase.from("creators").select("id, nama, assigned_cm_id");
  const { data: creators } =
    profile.role === "cm"
      ? await creatorQuery.eq("assigned_cm_id", profile.id)
      : await creatorQuery;

  return (
    <>
      <Topbar title="Dashboard" profile={profile} />
      <div className="p-7">
        <div className="grid grid-cols-3 gap-3.5 mb-6">
          <StatCard label={profile.role === "cm" ? "Creator Saya" : "Total Creator"} value={creators?.length ?? 0} />
          <StatCard label="Produk Aktif" value="—" />
          <StatCard label="Webinar Bulan Ini" value="—" />
        </div>

        <div className="bg-white border border-line rounded-md">
          <h2 className="text-[15.5px] font-bold px-5 pt-4 pb-2">
            {profile.role === "cm" ? "Creator binaan saya" : "Semua Creator"}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11.5px] text-gray-400 uppercase">
                <th className="text-left px-4 py-2.5 border-b border-line">Nama Creator</th>
              </tr>
            </thead>
            <tbody>
              {creators?.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 border-b border-line last:border-0">{c.nama}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
