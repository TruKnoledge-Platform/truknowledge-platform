"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Session = {
  id: string;
  title: string;
  order_index: number;
};

export default function PlayCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
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
        .select("id, title, order_index")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      setTitle(course.title);
      setSessions(sessionRows || []);
      setCurrentId(sessionRows?.[0]?.id || "");
      setLoading(false);
    }

    load();
  }, [courseId]);

  const current = sessions.find((s) => s.id === currentId);

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

        <div className="mt-6 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]">
          <p className="px-6 text-center text-slate-400">
            Video will appear here. You can add it in the session editor later.
          </p>
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
      </div>
    </main>
  );
}