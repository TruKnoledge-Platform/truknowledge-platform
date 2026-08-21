"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
};

export default function CourseDiscussion({
  courseId,
  enabled,
}: {
  courseId: string;
  enabled: boolean;
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [enrolled, setEnrolled] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, messages_opt_in")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!enrollment) return;
      setEnrolled(true);
      setOptIn(Boolean(enrollment.messages_opt_in));

      if (enabled) {
        const { data } = await supabase
          .from("course_comments")
          .select("id, body, created_at, user_id")
          .eq("course_id", courseId)
          .order("created_at", { ascending: true });
        setComments(data || []);
      }
    }

    load();
  }, [courseId, enabled]);

  async function saveOptIn(next: boolean) {
    setOptIn(next);
    await supabase
      .from("enrollments")
      .update({ messages_opt_in: next })
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");

    const { data, error } = await supabase
      .from("course_comments")
      .insert({
        course_id: courseId,
        user_id: userId,
        body: body.trim(),
      })
      .select("id, body, created_at, user_id")
      .single();

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data) setComments((prev) => [...prev, data]);
    setBody("");
  }

  if (!enrolled) return null;

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4">
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => saveOptIn(e.target.checked)}
        />
        Teacher may message me about this course
      </label>

      {enabled && (
        <div className="mt-4">
          <h2 className="text-base font-medium">Discussion</h2>
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {!comments.length && (
              <p className="text-sm text-slate-400">No comments yet.</p>
            )}
            {comments.map((item) => (
              <div key={item.id} className="rounded-lg bg-[#0B1220] px-3 py-2">
                <p className="text-sm text-slate-200">{item.body}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {item.user_id === userId ? "You" : "Learner"} ·{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <form onSubmit={addComment} className="mt-3 flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment"
              className="flex-1 rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </section>
  );
}