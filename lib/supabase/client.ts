import { createBrowserClient } from "@supabase/ssr";

// Dipakai di Client Component. Hanya pakai anon key — aman untuk browser
// karena semua akses data tetap difilter oleh Row Level Security (RLS).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
