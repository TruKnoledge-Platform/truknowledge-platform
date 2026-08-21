"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Thread = {
  courseId: string;
  courseTitle: string;
  teacherId: string;
  unread: number;
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export default function LearnerMessagesPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [current, setCurrent] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadThreads(uid: string) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id, messages_opt_in")
      .eq("user_id", uid)
      .eq("messages_opt_in", true);

    const opted = enrollments || [];
    if (!opted.length) {
      setThreads([]);
      return;
    }

    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, teacher_id")
      .in(
        "id",
        opted.map((row) => row.course_id)
      );

    const { data: unreadRows } = await supabase
      .from("messages")
      .select("course_id, sender_id")
      .eq("recipient_id", uid)
      .is("read_at", null);

    setThreads(
      (courses || []).map((course) => ({
        courseId: course.id,
        courseTitle: course.title,
        teacherId: course.teacher_id,
        unread: (unreadRows || []).filter((m) => m.course_id === course.id).length,
      }))
    );
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await loadThreads(user.id);
      setLoading(false);
    }
    load();
  }, []);

  async function openThread(thread: Thread) {
    setCurrent(thread);
    setError("");

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("course_id", thread.courseId)
      .eq("recipient_id", userId)
      .eq("sender_id", thread.teacherId)
      .is("read_at", null);

    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at")
      .eq("course_id", thread.courseId)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${thread.teacherId}),and(sender_id.eq.${thread.teacherId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);
    await loadThreads(userId);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !body.trim()) return;
    setSending(true);
    setError("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        course_id: current.courseId,
        sender_id: userId,
        recipient_id: current.teacherId,
        body: body.trim(),
      })
      .select("id, sender_id, recipient_id, body, created_at")
      .single();

    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) setMessages((prev) => [...prev, data]);
    setBody("");
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/learn" className="text-sm text-slate-400 hover:text-white">
          Back to my courses
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-slate-400">
          Teachers you allowed to message you. Orange numbers are unread.
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {loading && <p className="mt-6 text-slate-400">Loading...</p>}

        <div className="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {!threads.length && !loading && (
              <p className="text-sm text-slate-400">
                Opt in on a course to talk with the teacher.
              </p>
            )}
            {threads.map((thread) => (
              <button
                key={thread.courseId}
                type="button"
                onClick={() => openThread(thread)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left ${
                  current?.courseId === thread.courseId
                    ? "border-orange-500 bg-[#111827]"
                    : "border-slate-800 bg-[#111827]"
                }`}
              >
                <p className="truncate text-sm">{thread.courseTitle}</p>
                {thread.unread > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
            {!current && (
              <p className="text-sm text-slate-400">Choose a course to read and reply.</p>
            )}
            {current && (
              <>
                <h2 className="font-medium">{current.courseTitle}</h2>
                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
                  {!messages.length && (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  )}
                  {messages.map((item) => (
                    <div
                      key={item.id}
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        item.sender_id === userId
                          ? "ml-auto bg-orange-500/20"
                          : "bg-[#0B1220]"
                      }`}
                    >
                      <p>{item.body}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <form onSubmit={send} className="mt-4 flex gap-2">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write a reply"
                    className="flex-1 rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}