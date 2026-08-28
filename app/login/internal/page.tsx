"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginInternalPage() {
  const supabase = createClient();

  async function handleGoogleLogin() {
    // Redirect ke CLIENT page /auth/callback (bukan /api/auth/callback)
    // supaya exchange code terjadi di browser, bukan di server.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange to-[#FF8552] p-6">
      <div className="bg-white rounded-2xl w-full max-w-sm p-9 shadow-xl">
        <div className="w-11 h-11 rounded-lg bg-orange text-white flex items-center justify-center font-black text-lg mx-auto mb-4">
          BA
        </div>
        <h2 className="text-center text-lg font-bold mb-1">Masuk sebagai Tim Internal</h2>
        <p className="text-center text-xs text-ink-soft mb-7">
          Khusus Super Admin & Creator Manager
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 border border-line rounded-md py-3 text-sm font-medium hover:bg-gray-50"
        >
          Lanjutkan dengan Google
        </button>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Gunakan email kerja Bintang Agency kamu
        </p>

        <div className="text-center mt-6 text-xs text-ink-soft">
          Kamu seorang Creator?{" "}
          <a href="/login/creator" className="text-orange-dark font-semibold">
            Masuk di sini &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
