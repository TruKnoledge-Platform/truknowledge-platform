"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

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
      }

      setLoading(false);
    }

    load();
  }, [courseId]);

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
        <a href="/learn" className="text-sm text-slate-400 hover:text-white">
          Back to my courses
        </a>

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