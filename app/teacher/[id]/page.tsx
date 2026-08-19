"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const templates = [
  { id: "classic_linear", name: "Classic Linear" },
  { id: "card_grid", name: "Card Grid" },
  { id: "modular_chapters", name: "Modular Chapters" },
  { id: "focused_path", name: "Focused Path" },
];

type Session = {
  id: string;
  title: string;
  order_index: number;
  video_url: string | null;
};

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("classic_linear");
  const [isPublished, setIsPublished] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("id, title, order_index, video_url")
      .eq("course_id", id)
      .order("order_index", { ascending: true });

    setSessions(data || []);
  }

  useEffect(() => {
    async function loadCourse() {
      const { data, error } = await supabase
        .from("courses")
        .select("title, description, template, is_published")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError(error?.message || "Course not found");
        setLoading(false);
        return;
      }

      setTitle(data.title || "");
      setDescription(data.description || "");
      setTemplate(data.template || "classic_linear");
      setIsPublished(Boolean(data.is_published));
      await loadSessions();
      setLoading(false);
    }

    loadCourse();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("courses")
      .update({
        title,
        description,
        template,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/teacher");
    router.refresh();
  }

  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    setAdding(true);
    setError("");

    const { error } = await supabase.from("sessions").insert({
      course_id: id,
      title: newSessionTitle.trim(),
      order_index: sessions.length + 1,
    });

    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }

    setNewSessionTitle("");
    await loadSessions();
  }

  async function handleTogglePublish() {
    setPublishing(true);
    setError("");

    const nextValue = !isPublished;
    const { error } = await supabase
      .from("courses")
      .update({
        is_published: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setPublishing(false);

    if (error) {
      setError(error.message);
      return;
    }

    setIsPublished(nextValue);
  }

  async function saveSessionVideo(sessionId: string, videoUrl: string) {
    setError("");
    const { error } = await supabase
      .from("sessions")
      .update({ video_url: videoUrl })
      .eq("id", sessionId);

    if (error) {
      setError(error.message);
    }
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
      <div className="mx-auto max-w-3xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher area
        </a>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Edit course</h1>
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`rounded-lg px-4 py-2 font-medium ${
              isPublished
                ? "border border-slate-600 text-slate-200"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {publishing ? "Updating..." : isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Status: {isPublished ? "Published" : "Draft"}
        </p>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Course title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Short description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            >
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save course details"}
          </button>
        </form>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Sessions</h2>
          <p className="mt-1 text-sm text-slate-400">
            Add a title, then paste a YouTube or video link.
          </p>

          <div className="mt-4 space-y-3">
            {sessions.length === 0 && (
              <p className="text-slate-400">No sessions yet.</p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-slate-800 bg-[#111827] p-4"
              >
                <div className="mb-3">
                  <span className="text-sm text-orange-400">{session.order_index}</span>
                  <span className="ml-3 font-medium">{session.title}</span>
                </div>
                <input
                  defaultValue={session.video_url || ""}
                  placeholder="Paste video URL here"
                  className="mb-3 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                  onBlur={(e) => saveSessionVideo(session.id, e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Click outside the box to save the video link.
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSession} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Write New Session Title Here"
              className="flex-1 rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-orange-500 px-4 py-2 font-medium hover:bg-orange-600 disabled:opacity-60"
            >
              {adding ? "Adding..." : "Add session"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}