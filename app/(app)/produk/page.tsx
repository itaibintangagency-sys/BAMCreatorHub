import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";

export default async function ProdukPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();
  const isInternal = profile.role !== "creator";

  const { data: featured } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  const { data: allProducts } = await supabase
    .from("products")
    .select("*")
    .order("campaign_deadline", { ascending: true });

  return (
    <>
      <Topbar title="Produk" profile={profile} />
      <div className="p-7">
        <div className="flex justify-between items-center mb-5">
          <div className="text-[13px] text-ink-soft">
            Diurutkan berdasarkan tanggal kadaluarsa campaign
          </div>
          {isInternal && (
            <Link
              href="/produk/tambah"
              className="bg-orange text-white text-[13.5px] font-medium px-4 py-2 rounded-md"
            >
              + Tambah Produk
            </Link>
          )}
        </div>

        {featured && featured.length > 0 && (
          <>
            <h2 className="text-[15.5px] font-bold mb-3.5">Rekomendasi CM</h2>
            <ProductGrid products={featured} />
          </>
        )}

        <h2 className="text-[15.5px] font-bold mb-3.5 mt-7">Semua produk</h2>
        <ProductGrid products={allProducts ?? []} />
      </div>
    </>
  );
}

function ProductGrid({ products }: { products: any[] }) {
  const daysLeft = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {products.map((p) => {
        const left = p.campaign_deadline ? daysLeft(p.campaign_deadline) : null;
        return (
          <div key={p.id} className="bg-white border border-line rounded-md overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300">
              {p.product_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.product_image} alt={p.product_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">Belum ada gambar</span>
              )}
            </div>
            <div className="p-3">
              <div className="text-[11px] text-gray-400 mb-0.5">{p.store_name}</div>
              <div className="text-[13px] font-medium mb-1.5 line-clamp-2">{p.product_name}</div>
              <div className="text-orange font-bold text-sm">{p.price_range}</div>
              <div className="flex justify-between mt-2 pt-2 border-t border-line text-[11px]">
                <span className="text-green-700 font-semibold">Komisi {p.commission_rate}</span>
                {left !== null && (
                  <span className={left <= 3 ? "text-orange-dark font-semibold" : "text-gray-400"}>
                    {left > 0 ? `${left} hari lagi` : "Berakhir"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
