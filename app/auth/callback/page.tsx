"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
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

        setStatus("Berhasil! Mengalihkan ke dashboard...");
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("Unexpected error:", err);
        setStatus("Terjadi kesalahan.");
        setTimeout(() => router.replace("/login/internal"), 2000);
      });
  }, [searchParams, router]);

  return <p className="text-sm text-gray-600">{status}</p>;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange to-[#FF8552]">
      <div className="bg-white rounded-2xl p-9 shadow-xl text-center">
        <div className="w-11 h-11 rounded-lg bg-orange text-white flex items-center justify-center font-black text-lg mx-auto mb-4">
          BA
        </div>
        <Suspense fallback={<p className="text-sm text-gray-600">Loading...</p>}>
          <AuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
