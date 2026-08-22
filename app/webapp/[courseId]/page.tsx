"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import CourseDiscussion from "@/app/courses/course-discussion";

type Session = {
  id: string;
  title: string;
  order_index: number;
  video_url: string | null;
  body: string | null;
};

type Material = {
  id: string;
  session_id: string;
  title: string;
  file_url: string | null;
  is_advanced: boolean;
};

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
    return parsed.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export default function WebAppPage() {
  const { courseId; id } = useParams<{ courseId: string }>();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [published, setPublished] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId) || sessions[0],
    [sessions, currentId]
  );

  const sessionMaterials = materials.filter((m) => m.session_id === current?.id && !m.is_advanced);
  const advancedMaterials = materials.filter((m) => m.session_id === current?.id && m.is_advanced);
  const video = current?.video_url ? youtubeId(current.video_url) : "";

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data: course, error } = await supabase
        .from("courses")
        .select("title, description, price, is_published")
        .eq("id", id)
        .single();

      if (error || !course) {
        setError(error?.message || "Course not found");
        setLoading(false);
        return;
      }

      setTitle(course.title || "Course");
      setDescription(course.description || "");
      setPrice(Number(course.price || 0));
      setPublished(Boolean(course.is_published));

      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("course_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        setEnrolled(Boolean(enrollment));
      }

      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("id, title, order_index, video_url, body")
        .eq("course_id", id)
        .order("order_index", { ascending: true });

      const rows = sessionRows || [];
      setSessions(rows);
      if (rows[0]) setCurrentId(rows[0].id);

      if (rows.length) {
        const { data: mats } = await supabase
          .from("materials")
          .select("id, session_id, title, file_url, is_advanced")
          .in(
            "session_id",
            rows.map((s) => s.id)
          );
        setMaterials(mats || []);

        if (user) {
          const { data: progress } = await supabase
            .from("progress")
            .select("session_id, completed")
            .eq("user_id", user.id)
            .in(
              "session_id",
              rows.map((s) => s.id)
            );
          const map: Record<string, boolean> = {};
          (progress || []).forEach((row) => {
            map[row.session_id] = Boolean(row.completed);
          });
          setCompleted(map);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  async function enrollFree() {
    if (!userId) return;
    setEnrolling(true);
    setError("");
    const { error } = await supabase.from("enrollments").insert({
      course_id: id,
      user_id: userId,
      status: "active",
    });
    setEnrolling(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnrolled(true);
  }

  async function enrollPaid() {
    window.location.href = `/checkout?courseId=${id}&next=/webapp/${id}`;
  }

  async function markComplete() {
    if (!current || !userId) return;
    setError("");
    const { error } = await supabase.from("progress").upsert(
      {
        user_id: userId,
        session_id: current.id,
        completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,session_id" }
    );
    if (error) {
      setError(error.message);
      return;
    }
    setCompleted((prev) => ({ ...prev, [current.id]: true }));
  }

  async function share() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-orange-400">TruKnowledge Web App</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <button
            type="button"
            onClick={share}
            className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
          >
            {copied ? "Copied" : "Share"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {!userId && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-slate-300">{description || "Log in to enroll and start this course."}</p>
            <a
              href={`/login?next=/webapp/${id}`}
              className="mt-4 inline-block rounded-lg bg-orange-500 px-5 py-2 font-medium hover:bg-orange-600"
            >
              Log in to continue
            </a>
          </section>
        )}

        {userId && !enrolled && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <p className="text-slate-300">{description}</p>
            <p className="mt-2 text-sm text-orange-400">
              {price > 0 ? `$${price.toFixed(2)}` : "Free"}
            </p>
            {!published && (
              <p className="mt-2 text-sm text-yellow-400">This course is still a draft.</p>
            )}
            <button
              type="button"
              onClick={price > 0 ? enrollPaid : enrollFree}
              disabled={enrolling || !published}
              className="mt-4 rounded-lg bg-orange-500 px-5 py-2 font-medium hover:bg-orange-600 disabled:opacity-60"
            >
              {enrolling ? "Enrolling..." : price > 0 ? "Enroll and pay" : "Enroll free"}
            </button>
          </section>
        )}

        {userId && enrolled && (
          <>
            <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
              {video ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video}`}
                  title={current?.title || "Session"}
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  No video for this session yet.
                </div>
              )}
            </div>

            {current?.body && (
              <section className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4">
                <h2 className="text-base font-medium">Session notes</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {current.body}
                </p>
              </section>
            )}

            <CourseDiscussion courseId={id} />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                {current ? current.title : "No session selected"}
                {current && completed[current.id] ? " · this session is complete" : ""}
              </p>
              {current && (
                <button
                  type="button"
                  onClick={markComplete}
                  disabled={Boolean(current && completed[current.id])}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
                >
                  {current && completed[current.id] ? "Completed" : "Mark complete"}
                </button>
              )}
            </div>

            <label className="mt-6 block text-sm text-slate-300">Sessions</label>
            <select
              value={current?.id || ""}
              onChange={(e) => setCurrentId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            >
              {sessions.map((session, index) => (
                <option key={session.id} value={session.id}>
                  {index + 1}. {session.title}
                  {completed[session.id] ? " (complete)" : ""}
                </option>
              ))}
            </select>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-slate-800 bg-[#111827] p-4">
                <h2 className="text-sm font-medium">Session materials</h2>
                <div className="mt-3 space-y-2">
                  {!sessionMaterials.length && (
                    <p className="text-sm text-slate-500">No materials yet.</p>
                  )}
                  {sessionMaterials.map((item) => (
                    <a
                      key={item.id}
                      href={item.file_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-orange-400 hover:underline"
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </section>
              <section className="rounded-xl border border-slate-800 bg-[#111827] p-4">
                <h2 className="text-sm font-medium">Extra / Advanced materials</h2>
                <div className="mt-3 space-y-2">
                  {!advancedMaterials.length && (
                    <p className="text-sm text-slate-500">None yet.</p>
                  )}
                  {advancedMaterials.map((item) => (
                    <a
                      key={item.id}
                      href={item.file_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-orange-400 hover:underline"
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </section>
            </div>

            <p className="mt-8 text-xs text-slate-500">
              Powered by TruKnowledge ·{" "}
              <a href="/learn" className="text-orange-400 hover:underline">
                My courses
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}