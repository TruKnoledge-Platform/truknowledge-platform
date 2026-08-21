"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import CourseDiscussion from "@/app/courses/course-discussion";

type Session = {
  id: string;
  title: string;
  order_index: number;
  video_url: string | null;
};

type Material = {
  id: string;
  session_id: string;
  title: string;
  file_url: string | null;
  is_advanced: boolean;
};

function videoEmbed(url: string) {
  try {
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return url;
  }
  return url;
}

export default function PlayCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [userId, setUserId] = useState("");

  async function markProgress(sessionId: string, isComplete: boolean) {
    if (!userId || !sessionId) return;

    const { data: existing, error: findError } = await supabase
      .from("progress")
      .select("id")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (findError) {
      setError(findError.message);
      return;
    }

    const payload = {
      user_id: userId,
      session_id: sessionId,
      completed: isComplete,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = existing
      ? await supabase.from("progress").update(payload).eq("id", existing.id)
      : await supabase.from("progress").insert(payload);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setCompleted((prev) => ({ ...prev, [sessionId]: isComplete }));
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

      if (!enrollment) {
        router.push(`/courses/${courseId}`);
        return;
      }

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      if (courseError || !course) {
        setError(courseError?.message || "Course not found");
        setLoading(false);
        return;
      }

      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("id, title, order_index, video_url")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      const list = sessionRows || [];
      setTitle(course.title);
      setSessions(list);
      setCurrentId(list[0]?.id || "");

      if (list.length) {
        const { data: mats } = await supabase
          .from("materials")
          .select("id, session_id, title, file_url, is_advanced")
          .in(
            "session_id",
            list.map((s) => s.id)
          );
        setMaterials(mats || []);

        const { data: progressRows } = await supabase
          .from("progress")
          .select("session_id, completed")
          .eq("user_id", user.id)
          .in(
            "session_id",
            list.map((s) => s.id)
          );

        const map: Record<string, boolean> = {};
        (progressRows || []).forEach((row) => {
          map[row.session_id] = Boolean(row.completed);
        });
        setCompleted(map);
      }

      setLoading(false);
    }

    load();
  }, [courseId]);

  async function shareCourse() {
    const shareUrl = `${window.location.origin}/webapp/${courseId}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function markComplete() {
    if (!currentId) return;
    setSavingProgress(true);
    setError("");
    await markProgress(currentId, true);
    setSavingProgress(false);
  }

  const current = sessions.find((s) => s.id === currentId);
  const url = current?.video_url || "";
  const embed = url ? videoEmbed(url) : "";
  const isYouTube = embed.includes("youtube.com/embed");
  const sessionMaterials = materials.filter(
    (m) => m.session_id === currentId && !m.is_advanced
  );
  const advancedMaterials = materials.filter(
    (m) => m.session_id === currentId && m.is_advanced
  );
  const isComplete = Boolean(completed[currentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="/learn" className="text-sm text-slate-400 hover:text-white">
            Back to my courses
          </a>
          <button
            type="button"
            onClick={shareCourse}
            className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
          >
            {copied ? "Link copied" : "Share"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <p className="mt-6 text-sm text-orange-400">Now playing</p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-slate-400">
          {current ? current.title : "No sessions yet"}
        </p>

        <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]">
          {!url && (
            <div className="flex h-full items-center justify-center">
              <p className="px-6 text-center text-slate-400">
                No video yet for this session.
              </p>
            </div>
          )}
          {url && isYouTube && (
            <iframe
              src={embed}
              title={current?.title || "Session video"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {url && !isYouTube && (
            <video src={url} controls className="h-full w-full">
              Your browser does not support video.
            </video>
          )}
        </div>

        <CourseDiscussion courseId={courseId} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            {isComplete ? "This session is complete" : "In this session"}
          </p>
          <button
            type="button"
            onClick={markComplete}
            disabled={savingProgress || isComplete || !currentId}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {isComplete ? "Completed" : savingProgress ? "Saving..." : "Mark complete"}
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm text-slate-300">Course sessions</label>
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-3"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.order_index}. {session.title}
                {completed[session.id] ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <h2 className="mb-3 font-medium">Session materials</h2>
            {!sessionMaterials.length && (
              <p className="text-sm text-slate-400">No materials for this session.</p>
            )}
            {sessionMaterials.map((item) => (
              <a
                key={item.id}
                href={item.file_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="mb-2 block text-sm text-orange-400 hover:underline"
              >
                {item.title}
              </a>
            ))}
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
            <h2 className="mb-3 font-medium">Extra / Advanced materials</h2>
            {!advancedMaterials.length && (
              <p className="text-sm text-slate-400">None yet.</p>
            )}
            {advancedMaterials.map((item) => (
              <a
                key={item.id}
                href={item.file_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="mb-2 block text-sm text-orange-400 hover:underline"
              >
                {item.title}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}