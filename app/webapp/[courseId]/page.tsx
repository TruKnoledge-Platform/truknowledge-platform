"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import EnrollButton from "@/app/courses/enroll-button";
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

export default function WebAppPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [iconUrl, setIconUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");
  const [discussionsEnabled, setDiscussionsEnabled] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

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
      if (user) setUserId(user.id);

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select(
          "id, title, description, price, icon_url, thumbnail_url, preview_video_url, discussions_enabled, is_published, teacher_id"
        )
        .eq("id", courseId)
        .maybeSingle();

      if (courseError || !course) {
        setMissing(true);
        setLoading(false);
        return;
      }

      const owner = Boolean(user && user.id === course.teacher_id);
      setIsOwner(owner);
      setTitle(course.title || "");
      setDescription(course.description || "");
      setPrice(Number(course.price) || 0);
      setIconUrl(course.icon_url || "");
      setThumbnail(course.thumbnail_url || "");
      setPreviewVideo(course.preview_video_url || "");
      setDiscussionsEnabled(Boolean(course.discussions_enabled));
      setIsPublished(Boolean(course.is_published));

      if (!course.is_published && !owner) {
        setMissing(true);
        setLoading(false);
        return;
      }

      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("id, title, order_index, video_url, body")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      const list = sessionRows || [];
      setSessions(list);
      setCurrentId(list[0]?.id || "");

      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .eq("status", "active")
          .maybeSingle();
        setEnrolled(Boolean(enrollment) || owner);

        if (list.length && (enrollment || owner)) {
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
      }

      setLoading(false);
    }

    load();
  }, [courseId]);

  async function shareCourse() {
    await navigator.clipboard.writeText(window.location.href);
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
  const sneakPeek = previewVideo ? videoEmbed(previewVideo) : "";
  const sneakYouTube = sneakPeek.includes("youtube.com/embed");
  const canPlay = enrolled || isOwner;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        Loading...
      </main>
    );
  }

  if (missing) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-orange-400">TruKnowledge</p>
          <h1 className="mt-2 text-3xl font-semibold">This Web App is not available</h1>
          <p className="mt-3 text-slate-400">
            The course is unpublished, or the link is wrong.
          </p>
          <a href="/" className="mt-6 inline-block text-orange-400">
            Back to TruKnowledge
          </a>
        </div>
      </main>
    );
  }

  if (!canPlay) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-orange-400">TruKnowledge Web App</p>
            <button
              type="button"
              onClick={shareCourse}
              className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
            >
              {copied ? "Link copied" : "Share"}
            </button>
          </div>

          <div className="mt-8 flex items-start gap-4">
            {iconUrl && (
              <img
                src={iconUrl}
                alt=""
                className="h-16 w-16 rounded-xl border border-slate-800 object-cover"
              />
            )}
            <div>
              {!isPublished && (
                <p className="text-sm text-orange-400">Unpublished — only you can see this</p>
              )}
              <h1 className="text-4xl font-semibold">{title}</h1>
            </div>
          </div>

          <p className="mt-4 text-slate-300">
            {description || "No description yet."}
          </p>
          <p className="mt-3 text-lg text-orange-400">
            {price > 0 ? `$${price.toFixed(2)}` : "Free"}
          </p>

          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              className="mt-6 w-full rounded-2xl border border-slate-800 object-cover"
            />
          )}

          {sneakPeek && (
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]">
              {sneakYouTube ? (
                <iframe
                  src={sneakPeek}
                  title="Sneak peek"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={previewVideo} controls className="h-full w-full" />
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {isPublished ? (
            <EnrollButton
              courseId={courseId}
              price={price}
              next={`/webapp/${courseId}`}
            />
          ) : (
            <p className="mt-6 text-sm text-slate-400">
              Publish this course to let learners enroll.
            </p>
          )}

          {!userId && isPublished && (
            <p className="mt-4 text-sm text-slate-400">
              Already have an account?{" "}
              <a
                href={`/login?next=${encodeURIComponent(`/webapp/${courseId}`)}`}
                className="text-orange-400 hover:underline"
              >
                Log in
              </a>
            </p>
          )}

          {sessions.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Sessions</h2>
              <div className="mt-4 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-800 bg-[#111827] px-4 py-3"
                  >
                    <span className="text-sm text-orange-400">
                      {session.order_index}
                    </span>
                    <span className="ml-3">{session.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
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
        {isOwner && !isPublished && (
          <p className="mt-4 text-sm text-orange-400">
            Unpublished — learners cannot open this Web App until you publish.
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="h-10 w-10 rounded-lg border border-slate-800 object-cover"
            />
          )}
          <div>
            <p className="text-sm text-orange-400">Now playing</p>
            <h1 className="text-3xl font-semibold">{title}</h1>
          </div>
        </div>
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

        {current?.body && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-5">
            <h2 className="text-sm font-medium text-slate-300">Session notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
              {current.body}
            </p>
          </section>
        )}

        {discussionsEnabled && (
          <CourseDiscussion courseId={courseId} enabled />
        )}

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