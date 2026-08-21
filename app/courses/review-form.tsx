"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ReviewForm({ courseId }: { courseId: string }) {
  const supabase = createClient();
  const [state, setState] = useState<"loading" | "login" | "enroll" | "form">(
    "loading"
  );
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState("login");
        return;
      }

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!enrollment) {
        setState("enroll");
        return;
      }

      const { data: existing } = await supabase
        .from("reviews")
        .select("rating, comment")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existing) {
        setRating(existing.rating);
        setComment(existing.comment || "");
        setSaved(true);
      }

      setState("form");
    }

    check();
  }, [courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating < 1) {
      setError("Choose a star rating first.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      course_id: courseId,
      rating,
      comment,
    };

    const { error } = existing
      ? await supabase.from("reviews").update(payload).eq("id", existing.id)
      : await supabase.from("reviews").insert(payload);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
  }

  const shown = hover || rating;

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">Your review</h2>
        {saved && <span className="text-xs text-emerald-400">Saved</span>}
      </div>

      {state === "loading" && (
        <p className="mt-1 text-sm text-slate-400">Checking enrollment...</p>
      )}
      {state === "login" && (
        <p className="mt-1 text-sm text-slate-400">
          <a href="/login" className="text-orange-400 hover:underline">
            Log in
          </a>{" "}
          and enroll to review.
        </p>
      )}
      {state === "enroll" && (
        <p className="mt-1 text-sm text-slate-400">
          Enroll in this course to leave a review.
        </p>
      )}

      {state === "form" && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div
            className="flex items-end gap-3"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                className="flex flex-col items-center"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <span
                  className={`text-3xl leading-none ${
                    shown >= value ? "text-orange-400" : "text-slate-500"
                  }`}
                >
                  {shown >= value ? "★" : "☆"}
                </span>
                <span className="mt-1 text-xs text-slate-400">{value}</span>
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Short comment"
            className="w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
          />

          <button
            type="submit"
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium hover:bg-orange-600"
          >
            {saved ? "Update" : "Save"}
          </button>
        </form>
      )}
    </section>
  );
}