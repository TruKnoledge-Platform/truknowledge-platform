"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { saveCourseIcon, saveSiteIcon } from "./actions";

export default function IconUpload({
  kind,
  courseId,
  currentUrl,
}: {
  kind: "site" | "course";
  courseId?: string;
  currentUrl?: string | null;
}) {
  const [url, setUrl] = useState(currentUrl || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
      const folder =
        kind === "site" ? "thumbnails/site" : `thumbnails/${courseId}`;
      const path = `${folder}/${Date.now()}-icon-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("course-files")
        .upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("course-files").getPublicUrl(path);
      const fd = new FormData();
      fd.set("url", data.publicUrl);
      if (courseId) fd.set("courseId", courseId);
      if (kind === "site") await saveSiteIcon(fd);
      else await saveCourseIcon(fd);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-[#12182A]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#9AA3B5]">
            none
          </div>
        )}
      </div>
      <label className="cursor-pointer rounded-full bg-[#E8A24A] px-4 py-2 text-sm font-medium text-[#0B1020]">
        {busy ? "Uploading…" : "Choose icon"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}