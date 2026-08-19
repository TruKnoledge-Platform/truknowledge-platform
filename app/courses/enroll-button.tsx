"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function EnrollButton({ courseId }: { courseId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
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

  async function enroll() {
    setError("");
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

  return (
    <div className="mt-6">
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={enroll}
        className="rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600"
      >
        Enroll
      </button>
    </div>
  );
}