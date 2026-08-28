"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// Client-side OAuth Callback
// ============================================================
// Browser melakukan exchangeCodeForSession SENDIRI di sini.
// Cookie session di-set langsung oleh browser Supabase client
// (bukan server) — sehingga PASTI tersimpan di browser.
//
// Ini menggantikan /api/auth/callback yang gagal menyimpan
// cookie karena limitasi Next.js 14 + Vercel pada redirect.
// ============================================================

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Sedang memproses login...");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("Kode autentikasi tidak ditemukan.");
      setTimeout(() => router.replace("/login/internal"), 2000);
      return;
    }

    const supabase = createClient();

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error("Exchange error:", error.message);
          setStatus("Gagal login: " + error.message);
          setTimeout(() => router.replace("/login/internal?error=exchange_failed"), 2000);
          return;
        }

        // Session berhasil — cookie sudah di-set oleh browser client.
        // Navigate ke dashboard.
        setStatus("Berhasil! Mengalihkan ke dashboard...");
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("Unexpected error:", err);
        setStatus("Terjadi kesalahan.");
        setTimeout(() => router.replace("/login/internal"), 2000);
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange to-[#FF8552]">
      <div className="bg-white rounded-2xl p-9 shadow-xl text-center">
        <div className="w-11 h-11 rounded-lg bg-orange text-white flex items-center justify-center font-black text-lg mx-auto mb-4">
          BA
        </div>
        <p className="text-sm text-gray-600">{status}</p>
      </div>
    </div>
  );
}
