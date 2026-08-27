"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { redirect } from "next/navigation";

export async function tambahProduk(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "creator") {
    throw new Error("Tidak punya akses untuk menambah produk.");
  }

  const supabase = createClient();

  const payload = {
    product_name: formData.get("product_name") as string,
    campaign_link: formData.get("campaign_link") as string,
    price_range: formData.get("price_range") as string,
    category: formData.get("category") as string,
    campaign_deadline: formData.get("campaign_deadline") as string,
    commission_rate: formData.get("commission_rate") as string,
    store_name: formData.get("store_name") as string,
    is_featured: formData.get("is_featured") === "on",
    created_by: profile.id,
    image_status: "pending",
  };

  const { data, error } = await supabase.from("products").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  // Trigger workflow n8n untuk auto-fetch gambar dari campaign_link (WF-01).
  // Lihat n8n-workflows/auto-fetch-gambar-produk.json
  if (process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: data.id, campaign_link: payload.campaign_link }),
    }).catch(() => {
      // n8n gagal dipanggil bukan alasan menggagalkan penyimpanan produk —
      // CM tetap bisa upload gambar manual dari halaman produk.
    });
  }

  redirect("/produk");
}
