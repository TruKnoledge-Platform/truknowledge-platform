"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function EnrollButton({
  courseId,
  price,
}: {
  courseId: string;
  price: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      setEnrolled(Boolean(data));
      setLoading(false);
    }

    check();
  }, [courseId]);

  async function enrollFree() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("enrollments").insert({
      user_id: user.id,
      course_id: courseId,
      status: "active",
    });

    if (error) {
      setError(error.message);
      return;
    }

    setEnrolled(true);
    router.push("/learn");
    router.refresh();
  }

  async function enrollPaid() {
    setWorking(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        setError(text.slice(0, 180) || "Checkout failed");
        setWorking(false);
        return;
      }

      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout");
        setWorking(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setWorking(false);
    }
  }

  if (loading) return null;

  if (enrolled) {
    return (
      <a
        href="/learn"
        className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600"
      >
        Continue learning
      </a>
    );
  }

  const isPaid = Number(price) > 0;

  return (
    <div className="mt-6">
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={working}
        onClick={isPaid ? enrollPaid : enrollFree}
        className="rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600 disabled:opacity-60"
      >
        {working
          ? "Opening checkout..."
          : isPaid
            ? `Enroll · $${Number(price).toFixed(2)}`
            : "Enroll free"}
      </button>
    </div>
  );
}