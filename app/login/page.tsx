"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const next =
      new URLSearchParams(window.location.search).get("next") || "/learn";
    router.push(next);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B1220] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-[#111827] p-8 shadow-xl"
      >
        <h1 className="text-2xl font-semibold text-white mb-2">Log in</h1>
        <p className="text-sm text-slate-400 mb-6">
          Welcome back to TruKnowledge
        </p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <label className="block text-sm text-slate-300 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-lg bg-[#0B1220] border border-slate-700 px-3 py-2 text-white"
        />

        <label className="block text-sm text-slate-300 mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-6 w-full rounded-lg bg-[#0B1220] border border-slate-700 px-3 py-2 text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          No account yet?{" "}
          <a href="/signup" className="text-orange-400 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}