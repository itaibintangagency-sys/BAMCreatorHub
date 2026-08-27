import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creatorCodeToEmail } from "@/lib/supabase/creator-auth";

// Wrapper tipis di server: terima ID + Password dari form,
// ubah ID jadi email sintetis, lalu panggil signInWithPassword biasa.
// Creator tidak pernah melihat kata "email" di UI mereka.
export async function POST(request: Request) {
  const { creatorCode, password } = await request.json();

  if (!creatorCode || !password) {
    return NextResponse.json(
      { message: "ID Creator dan Password wajib diisi." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const email = creatorCodeToEmail(creatorCode);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      { message: "ID atau password salah." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
