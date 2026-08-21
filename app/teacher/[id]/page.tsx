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

type Material = {
  id: string;
  session_id: string;
  title: string;
  file_url: string | null;
  is_advanced: boolean;
};

type Enrollment = {
  id: string;
  user_id: string;
  status: string;
  email: string;
  completed: number;
  messagesOptIn: boolean;
};

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");
  const [price, setPrice] = useState("0");
  const [template, setTemplate] = useState("classic_linear");
  const [isPublished, setIsPublished] = useState(false);
  const [discussionsEnabled, setDiscussionsEnabled] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [materialTitle, setMaterialTitle] = useState<Record<string, string>>({});
  const [materialUrl, setMaterialUrl] = useState<Record<string, string>>({});
  const [materialAdvanced, setMaterialAdvanced] = useState<Record<string, boolean>>({});
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

    const rows = data || [];
    setSessions(rows);

    if (rows.length) {
      const { data: mats } = await supabase
        .from("materials")
        .select("id, session_id, title, file_url, is_advanced")
        .in(
          "session_id",
          rows.map((s) => s.id)
        );
      setMaterials(mats || []);
    } else {
      setMaterials([]);
    }

    return rows;
  }

  async function loadEnrollments(sessionRows: Session[]) {
    const { data: enrollRows } = await supabase
      .from("enrollments")
      .select("id, user_id, status, messages_opt_in")
      .eq("course_id", id)
      .order("created_at", { ascending: false });

    const list = enrollRows || [];
    const userIds = list.map((row) => row.user_id);
    const sessionIds = sessionRows.map((row) => row.id);

    let profiles: { id: string; email: string | null }[] = [];
    let progressRows: { user_id: string; session_id: string; completed: boolean }[] = [];

    if (userIds.length) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      profiles = profileRows || [];

      if (sessionIds.length) {
        const { data: prog } = await supabase
          .from("progress")
          .select("user_id, session_id, completed")
          .in("user_id", userIds)
          .in("session_id", sessionIds);
        progressRows = prog || [];
      }
    }

    setEnrollments(
      list.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        status: row.status || "active",
        email: profiles.find((p) => p.id === row.user_id)?.email || "Unknown learner",
        completed: progressRows.filter(
          (p) => p.user_id === row.user_id && p.completed
        ).length,
        messagesOptIn: Boolean(row.messages_opt_in),
      }))
    );
  }

  useEffect(() => {
    if (id && typeof window !== "undefined") {
      setWebAppUrl(`${window.location.origin}/webapp/${id}`);
    }

    async function loadCourse() {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "title, description, template, is_published, thumbnail_url, price, preview_video_url, discussions_enabled"
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        setError(error?.message || "Course not found");
        setLoading(false);
        return;
      }

      setTitle(data.title || "");
      setDescription(data.description || "");
      setThumbnail(data.thumbnail_url || "");
      setPreviewVideo(data.preview_video_url || "");
      setPrice(String(data.price ?? 0));
      setTemplate(data.template || "classic_linear");
      setIsPublished(Boolean(data.is_published));
      setDiscussionsEnabled(Boolean(data.discussions_enabled));
      const sessionRows = await loadSessions();
      await loadEnrollments(sessionRows);
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
        thumbnail_url: thumbnail,
        preview_video_url: previewVideo,
        template,
        price: Number(price) || 0,
        discussions_enabled: discussionsEnabled,
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

  async function deleteSession(sessionId: string) {
    const ok = window.confirm("Delete this session and its materials?");
    if (!ok) return;

    setError("");
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
    if (error) {
      setError(error.message);
      return;
    }

    const rows = await loadSessions();
    await loadEnrollments(rows);
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

    if (error) setError(error.message);
  }

  async function addMaterial(sessionId: string) {
    const titleValue = (materialTitle[sessionId] || "").trim();
    const urlValue = (materialUrl[sessionId] || "").trim();
    if (!titleValue || !urlValue) {
      setError("Material needs a title and a link.");
      return;
    }

    setError("");
    const { error } = await supabase.from("materials").insert({
      session_id: sessionId,
      title: titleValue,
      file_url: urlValue,
      is_advanced: Boolean(materialAdvanced[sessionId]),
    });

    if (error) {
      setError(error.message);
      return;
    }

    setMaterialTitle((prev) => ({ ...prev, [sessionId]: "" }));
    setMaterialUrl((prev) => ({ ...prev, [sessionId]: "" }));
    setMaterialAdvanced((prev) => ({ ...prev, [sessionId]: false }));
    await loadSessions();
  }

  async function copyWebAppLink() {
    if (!webAppUrl) return;
    await navigator.clipboard.writeText(webAppUrl);
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

        <details className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <summary className="cursor-pointer text-lg font-medium">
            Who enrolled ({enrollments.length})
          </summary>
          <div className="mt-4 space-y-2">
            {!enrollments.length && (
              <p className="text-sm text-slate-400">No enrollments yet.</p>
            )}
            {enrollments.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2"
              >
                <div>
                  <p className="text-sm">{item.email}</p>
                  <p className="text-xs text-slate-500">
                    {item.status}
                    {item.messagesOptIn ? " · messages on" : " · messages off"}
                  </p>
                </div>
                <p className="text-xs text-orange-400">
                  {item.completed} / {sessions.length} sessions complete
                </p>
              </div>
            ))}
          </div>
        </details>

        <section className="mt-6 rounded-2xl border border-orange-500/40 bg-[#111827] p-5">
          <h2 className="text-lg font-medium">Web App</h2>
          <p className="mt-1 text-sm text-slate-400">
            Share this link. Learners log in, enroll, and use the course as a
            standalone Web App. Edits you make here stay in sync.
          </p>
          <p className="mt-3 break-all rounded-lg bg-[#0B1220] px-3 py-2 text-sm text-orange-300">
            {webAppUrl}
          </p>
          <button
            type="button"
            onClick={copyWebAppLink}
            className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600"
          >
            {copied ? "Copied" : "Copy Web App link"}
          </button>
        </section>

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
            <label className="mb-2 block text-sm text-slate-300">Course image URL</label>
            <input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Sneak peek video URL</label>
            <input
              value={previewVideo}
              onChange={(e) => setPreviewVideo(e.target.value)}
              placeholder="Paste a YouTube link"
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Price (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">Use 0 for a free course.</p>
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

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={discussionsEnabled}
              onChange={(e) => setDiscussionsEnabled(e.target.checked)}
            />
            Enable discussion on this course
          </label>

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
            Add a video link and materials for each session.
          </p>

          <div className="mt-4 space-y-4">
            {sessions.length === 0 && <p className="text-slate-400">No sessions yet.</p>}
            {sessions.map((session) => {
              const sessionMaterials = materials.filter((m) => m.session_id === session.id);
              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-slate-800 bg-[#111827] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm text-orange-400">{session.order_index}</span>
                      <span className="ml-3 font-medium">{session.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSession(session.id)}
                      className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-400"
                    >
                      Delete session
                    </button>
                  </div>

                  <input
                    defaultValue={session.video_url || ""}
                    placeholder="Paste video URL here"
                    className="mb-4 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                    onBlur={(e) => saveSessionVideo(session.id, e.target.value)}
                  />

                  <p className="mb-2 text-sm text-slate-300">Materials</p>
                  <div className="mb-3 space-y-2">
                    {sessionMaterials.map((item) => (
                      <a
                        key={item.id}
                        href={item.file_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-orange-400 hover:underline"
                      >
                        {item.title}
                        {item.is_advanced ? " (advanced)" : ""}
                      </a>
                    ))}
                  </div>

                  <input
                    value={materialTitle[session.id] || ""}
                    onChange={(e) =>
                      setMaterialTitle((prev) => ({ ...prev, [session.id]: e.target.value }))
                    }
                    placeholder="Material title"
                    className="mb-2 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                  />
                  <input
                    value={materialUrl[session.id] || ""}
                    onChange={(e) =>
                      setMaterialUrl((prev) => ({ ...prev, [session.id]: e.target.value }))
                    }
                    placeholder="Material link (PDF, Google Doc, etc.)"
                    className="mb-2 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                  />
                  <label className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={Boolean(materialAdvanced[session.id])}
                      onChange={(e) =>
                        setMaterialAdvanced((prev) => ({
                          ...prev,
                          [session.id]: e.target.checked,
                        }))
                      }
                    />
                    Extra / Advanced material
                  </label>
                  <button
                    type="button"
                    onClick={() => addMaterial(session.id)}
                    className="rounded-lg border border-orange-500 px-3 py-2 text-sm text-orange-400"
                  >
                    Add material
                  </button>
                </div>
              );
            })}
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