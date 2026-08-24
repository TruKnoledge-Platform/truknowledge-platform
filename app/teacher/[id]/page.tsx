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
  body: string | null;
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
  const [materialFile, setMaterialFile] = useState<Record<string, File | null>>({});
  const [materialAdvanced, setMaterialAdvanced] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File, folder: string) {
    const safe = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const path = `${folder}/${id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("course-files").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("course-files").getPublicUrl(path);
    return data.publicUrl;
  }

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("id, title, order_index, video_url, body")
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

    async function loadCourse() {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "title, description, template, is_published, thumbnail_url, price, preview_video_url, discussions_enabled, webapp_slug"
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
      if (data.webapp_slug) {
        setWebAppUrl(`https://${data.webapp_slug}.truknowledge.center`);
      } else {
        setWebAppUrl(`https://truknowledge.center/webapp/${id}`);
      }
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

  async function handleThumbnail(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFile(file, "thumbnails");
      setThumbnail(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
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

  async function moveSession(sessionId: string, direction: -1 | 1) {
    const index = sessions.findIndex((s) => s.id === sessionId);
    const other = sessions[index + direction];
    if (index < 0 || !other) return;

    const current = sessions[index];
    setError("");

    const { error: firstError } = await supabase
      .from("sessions")
      .update({ order_index: other.order_index })
      .eq("id", current.id);
    const { error: secondError } = await supabase
      .from("sessions")
      .update({ order_index: current.order_index })
      .eq("id", other.id);

    if (firstError || secondError) {
      setError(firstError?.message || secondError?.message || "Could not reorder");
      return;
    }

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

  async function deleteMaterial(materialId: string) {
    const ok = window.confirm("Delete this material?");
    if (!ok) return;
    const { error } = await supabase.from("materials").delete().eq("id", materialId);
    if (error) {
      setError(error.message);
      return;
    }
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

  async function saveSessionTitle(sessionId: string, nextTitle: string) {
    const value = nextTitle.trim();
    if (!value) return;
    setError("");
    const { error } = await supabase
      .from("sessions")
      .update({ title: value })
      .eq("id", sessionId);
    if (error) {
      setError(error.message);
      return;
    }
    await loadSessions();
  }

  async function saveSessionVideo(sessionId: string, videoUrl: string) {
    setError("");
    const { error } = await supabase
      .from("sessions")
      .update({ video_url: videoUrl })
      .eq("id", sessionId);

    if (error) setError(error.message);
  }

  async function saveSessionBody(sessionId: string, body: string) {
    setError("");
    const { error } = await supabase
      .from("sessions")
      .update({ body })
      .eq("id", sessionId);
    if (error) setError(error.message);
  }

  async function addMaterial(sessionId: string) {
    const titleValue = (materialTitle[sessionId] || "").trim();
    const file = materialFile[sessionId];
    let urlValue = (materialUrl[sessionId] || "").trim();

    if (!titleValue || (!urlValue && !file)) {
      setError("Material needs a title and a file or a link.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      if (file) urlValue = await uploadFile(file, "materials");
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }
    setUploading(false);

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
    setMaterialFile((prev) => ({ ...prev, [sessionId]: null }));
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
          <div className="flex flex-wrap gap-2">
            <a
              href={`/courses/${id}`}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm"
            >
              Preview
            </a>
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
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Status: {isPublished ? "Published" : "Draft"}
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {uploading && <p className="mt-2 text-sm text-orange-400">Uploading...</p>}

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
	<a
            href={`/teacher/${id}/domain`}
            className="mt-3 mr-3 inline-block rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
          >
            Change address
          </a>
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
            <p className="mb-2 text-sm text-slate-300">Course image</p>
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600">
              Upload course image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleThumbnail(e.target.files?.[0])}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              Click the orange button. JPG or PNG. You can still paste a URL below.
            </p>
            <input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
            />
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Course"
                className="mt-3 w-[20%] rounded-lg border border-slate-800"
              />
            )}
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
            Click a session name to rename it. Session notes save when you click outside the box.
          </p>

          <div className="mt-4 space-y-4">
            {sessions.length === 0 && <p className="text-slate-400">No sessions yet.</p>}
            {sessions.map((session, index) => {
              const sessionMaterials = materials.filter((m) => m.session_id === session.id);
              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-slate-800 bg-[#111827] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="text-sm text-orange-400">{index + 1}</span>
                      <input
                        defaultValue={session.title}
                        key={`${session.id}-${session.title}`}
                        onBlur={(e) => saveSessionTitle(session.id, e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#0B1220] px-2 py-1 font-medium"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveSession(session.id, -1)}
                        disabled={index === 0}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSession(session.id, 1)}
                        disabled={index === sessions.length - 1}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(session.id)}
                        className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-400"
                      >
                        Delete session
                      </button>
                    </div>
                  </div>

                  <input
                    defaultValue={session.video_url || ""}
                    placeholder="Paste video URL here"
                    className="mb-3 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                    onBlur={(e) => saveSessionVideo(session.id, e.target.value)}
                  />

                  <p className="mb-2 text-sm text-slate-300">Session notes</p>
                  <textarea
                    defaultValue={session.body || ""}
                    key={`${session.id}-body-${session.body || ""}`}
                    placeholder="Write the information for this session"
                    rows={6}
                    className="mb-4 w-full rounded-lg border border-slate-700 bg-[#0B1220] px-3 py-2 text-sm"
                    onBlur={(e) => saveSessionBody(session.id, e.target.value)}
                  />

                  <p className="mb-2 text-sm text-slate-300">Materials</p>
                  <div className="mb-3 space-y-2">
                    {sessionMaterials.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <a
                          href={item.file_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-orange-400 hover:underline"
                        >
                          {item.title}
                          {item.is_advanced ? " (advanced)" : ""}
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteMaterial(item.id)}
                          className="text-xs text-red-400"
                        >
                          Delete
                        </button>
                      </div>
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
                  <label className="mb-2 inline-flex cursor-pointer items-center rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400">
                    Upload file
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setMaterialFile((prev) => ({
                          ...prev,
                          [session.id]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                  {materialFile[session.id] && (
                    <p className="mb-2 text-xs text-slate-400">
                      Selected: {materialFile[session.id]?.name}
                    </p>
                  )}
                  <input
                    value={materialUrl[session.id] || ""}
                    onChange={(e) =>
                      setMaterialUrl((prev) => ({ ...prev, [session.id]: e.target.value }))
                    }
                    placeholder="Or paste a material link"
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