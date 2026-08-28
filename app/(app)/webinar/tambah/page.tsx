import { getCurrentProfile } from "@/lib/get-current-profile";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import { tambahWebinar } from "../actions";

export default async function TambahWebinarPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role === "creator") redirect("/webinar");

  return (
    <>
      <Topbar title="Tambah Webinar" profile={profile} />
      <form action={tambahWebinar} className="p-7 max-w-xl">
        <div className="bg-white border border-line rounded-md p-6 space-y-4">
          <Field label="Judul webinar" name="title" required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Kategori</label>
              <select name="category" className="w-full border border-line rounded-md px-3 py-2.5 text-sm">
                <option>Non SVTC</option>
                <option>Bintang Next Level</option>
                <option>Golden Tick Acceleration</option>
                <option>Golden Tick Shopee Pusat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Eligibility</label>
              <select name="eligibility_type" className="w-full border border-line rounded-md px-3 py-2.5 text-sm">
                <option>Eligible for All</option>
                <option>Invite Only</option>
                <option>Golden Tick Only</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" name="event_date" type="date" required />
            <Field label="Jam" name="event_time" placeholder="14:00 WIB" />
          </div>
          <Field label="Link registrasi" name="registration_link" placeholder="https://..." />
          <Field
            label="Segmentasi peserta (opsional)"
            name="target_segment"
            placeholder="Contoh: Semua Golden Tick tier Gold ke atas"
          />
          <div>
            <label className="block text-xs font-medium mb-1.5">Deskripsi</label>
            <textarea
              name="description"
              rows={3}
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button type="submit" className="bg-orange text-white font-bold text-[13.5px] px-5 py-2.5 rounded-md">
            Simpan jadwal
          </button>
          <a href="/webinar" className="border border-line text-[13.5px] px-5 py-2.5 rounded-md">
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
        className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
      />
    </div>
  );
}
