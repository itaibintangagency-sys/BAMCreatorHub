"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginCreatorPage() {
  const router = useRouter();
  const [creatorCode, setCreatorCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!creatorCode.trim() || !password) {
      setError("ID Creator dan Password wajib diisi.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/creator-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorCode, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message || "ID atau password salah. Coba lagi.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange to-[#FF8552] p-6">
      <div className="bg-white rounded-2xl w-full max-w-sm p-9 shadow-xl">
        <div className="w-11 h-11 rounded-lg bg-orange text-white flex items-center justify-center font-black text-lg mx-auto mb-4">
          BA
        </div>
        <h2 className="text-center text-lg font-bold mb-1">Masuk sebagai Creator</h2>
        <p className="text-center text-xs text-ink-soft mb-7">
          Gunakan ID & Password yang diberikan CM kamu
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5">ID Creator</label>
            <input
              type="text"
              value={creatorCode}
              onChange={(e) => setCreatorCode(e.target.value)}
              placeholder="contoh: BA-CR-01245"
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-orange"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-orange"
            />
          </div>

          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange text-white rounded-md py-3 text-sm font-bold hover:bg-orange-dark disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Lupa password? Hubungi CM kamu untuk direset.
        </p>

        <div className="text-center mt-6 text-xs text-ink-soft">
          Tim internal?{" "}
          <a href="/login/internal" className="text-orange-dark font-semibold">
            Masuk di sini &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
