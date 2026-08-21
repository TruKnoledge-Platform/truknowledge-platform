"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/")) {
      router.push(next);
      router.refresh();
      return;
    }

    if (user) {
      const { data: taught } = await supabase
        .from("courses")
        .select("id")
        .eq("teacher_id", user.id)
        .limit(1);

      router.push(taught?.length ? "/teacher" : "/learn");
    } else {
      router.push("/learn");
    }

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-md">
        <a href="/" className="text-sm text-slate-400 hover:text-white">
          Back to home
        </a>
        <h1 className="mt-6 text-3xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-slate-400">
          Teachers go to the back office. Learners go to My courses.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          No account?{" "}
          <a href="/signup" className="text-orange-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}