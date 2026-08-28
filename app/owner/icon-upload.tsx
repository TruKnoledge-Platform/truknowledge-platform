"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { saveCourseIcon, saveSiteIcon } from "./actions";

const SIZE = 512;

async function resizeToSquare(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this image");

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Could not resize this image");
  return new File([blob], "icon.png", { type: "image/png" });
}

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
      const resized = await resizeToSquare(file);
      const supabase = createClient();
      const stable =
        kind === "site"
          ? "thumbnails/site/current.png"
          : `thumbnails/${courseId}/current-icon.png`;

      const { error: upErr } = await supabase.storage
        .from("course-files")
        .upload(stable, resized, {
          contentType: "image/png",
          upsert: true,
        });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("course-files").getPublicUrl(stable);
      const fd = new FormData();
      fd.set("url", `${data.publicUrl}?v=${Date.now()}`);
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
    <div>
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
          {busy ? "Resizing…" : "Choose icon"}
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
      <p className="mt-2 text-xs text-[#9AA3B5]">
        Any photo is fine. We crop the center to a square and resize to 512×512
        for the browser tab and phone home screen.
      </p>
    </div>
  );
}