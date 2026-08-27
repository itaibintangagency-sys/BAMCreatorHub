import { getCurrentProfile } from "@/lib/get-current-profile";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import { tambahProduk } from "../actions";

export default async function TambahProdukPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role === "creator") redirect("/produk");

  return (
    <>
      <Topbar title="Tambah Produk" profile={profile} />
      <form action={tambahProduk} className="p-7 max-w-xl">
        <div className="bg-white border border-line rounded-md p-6 space-y-4">
          <Field label="Nama produk" name="product_name" required />
          <Field
            label="Link produk campaign"
            name="campaign_link"
            placeholder="https://s.shopee.co.id/..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Harga produk" name="price_range" placeholder="Rp89.000~Rp120.000" />
            <Field label="Komisi affiliate" name="commission_rate" placeholder="12%" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori" name="category" />
            <Field label="Kadaluarsa campaign" name="campaign_deadline" type="date" />
          </div>
          <Field label="Nama toko" name="store_name" />

          <label className="flex items-center gap-2.5 text-[13px] pt-2 border-t border-line">
            <input type="checkbox" name="is_featured" className="w-4 h-4" />
            Tampilkan di Rekomendasi CM
          </label>

          <p className="text-[11.5px] text-ink-soft bg-orange-lighter p-3 rounded-md">
            Gambar produk akan diambil otomatis dari link campaign lewat n8n (WF-01) setelah
            disimpan. Kalau gagal, kamu bisa upload manual dari halaman detail produk.
          </p>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button type="submit" className="bg-orange text-white font-bold text-[13.5px] px-5 py-2.5 rounded-md">
            Simpan produk
          </button>
          <a href="/produk" className="border border-line text-[13.5px] px-5 py-2.5 rounded-md">
            Batal
          </a>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full border border-line rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-orange"
      />
    </div>
  );
}
