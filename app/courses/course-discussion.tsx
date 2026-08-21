"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import RecordView from "@/app/record-view";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
};

export default function CourseDiscussion({
  courseId,
}: {
  courseId: string;
  enabled?: boolean;
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [enrolled, setEnrolled] = useState(false);
  const [discussionsOn, setDiscussionsOn] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: course } = await supabase
        .from("courses")
        .select("discussions_enabled")
        .eq("id", courseId)
        .single();

      setDiscussionsOn(Boolean(course?.discussions_enabled));

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id, messages_opt_in")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (enrollment) {
        setEnrolled(true);
        setOptIn(Boolean(enrollment.messages_opt_in));
      }

      if (course?.discussions_enabled) {
        const { data } = await supabase
          .from("course_comments")
          .select("id, body, created_at, user_id")
          .eq("course_id", courseId)
          .order("created_at", { ascending: true });
        setComments(data || []);
      }

      setLoading(false);
    }

    load();
  }, [courseId]);

  async function saveOptIn(next: boolean) {
    if (!userId) return;
    setOptIn(next);
    const { error } = await supabase
      .from("enrollments")
      .update({ messages_opt_in: next })
      .eq("user_id", userId)
      .eq("course_id", courseId);
    if (error) setError(error.message);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !userId) return;
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

  return (
    <section className="mt-6 rounded-xl border border-orange-500/40 bg-[#111827] p-4">
      <RecordView courseId={courseId} />
      <h2 className="text-base font-medium">Messages & discussion</h2>

      {loading && <p className="mt-2 text-sm text-slate-400">Loading...</p>}

      {!loading && !userId && (
        <p className="mt-2 text-sm text-slate-400">Log in to join the discussion.</p>
      )}

      {!loading && userId && !enrolled && (
        <p className="mt-2 text-sm text-slate-400">
          Enroll in this course to comment and to allow teacher messages.
        </p>
      )}

      {!loading && enrolled && (
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => saveOptIn(e.target.checked)}
          />
          Teacher may message me about this course
        </label>
      )}

      {!loading && enrolled && !discussionsOn && (
        <p className="mt-3 text-sm text-slate-500">
          The teacher has not opened discussion on this course yet.
        </p>
      )}

      {!loading && enrolled && discussionsOn && (
        <div className="mt-4">
          <p className="text-sm text-slate-400">Discussion</p>
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