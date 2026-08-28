import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Dipakai di Server Component, Server Action, dan Route Handler.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component (bukan Server Action/Route Handler) —
            // aman diabaikan, sesi tetap ter-refresh lewat middleware.
          }
        },
      },
    }
  );
}

// Dipakai HANYA di route handler server-side yang butuh bypass RLS
// (misalnya proses admin tertentu). Service role key TIDAK PERNAH boleh
// dikirim ke client.
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
