// Layer 2 auth: Creator login pakai ID + Password, bukan email.
// Di balik layar kita tetap pakai Supabase Auth (supaya dapat session
// management & RLS gratis) dengan mengonversi ID jadi "email" sintetis
// yang tidak pernah terlihat oleh Creator.
//
// creator_code "BA-CR-01245" -> "ba-cr-01245@internal.bintangcreatorhub.app"

export function creatorCodeToEmail(creatorCode: string): string {
  const domain = process.env.CREATOR_EMAIL_DOMAIN || "internal.bintangcreatorhub.app";
  const normalized = creatorCode.trim().toLowerCase().replace(/\s+/g, "-");
  return `${normalized}@${domain}`;
}
