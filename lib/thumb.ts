export function linkThumbnail(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (/\.(png|jpe?g|gif|webp|avif)$/i.test(parsed.pathname)) return url;
  } catch {
    return null;
  }
  return null;
}

export function sessionPicture(
  thumbnailUrl?: string | null,
  videoUrl?: string | null
) {
  if (thumbnailUrl) return thumbnailUrl;
  return linkThumbnail(videoUrl);
}

export function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    const timer = window.setTimeout(() => finish(null), 8000);
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onerror = () => {
      window.clearTimeout(timer);
      finish(null);
    };
    video.onloadeddata = () => {
      const target = Number.isFinite(video.duration)
        ? Math.min(1, Math.max(0.1, video.duration / 3))
        : 0.1;
      try {
        video.currentTime = target;
      } catch {
        window.clearTimeout(timer);
        finish(null);
      }
    };
    video.onseeked = () => {
      window.clearTimeout(timer);
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx || !video.videoWidth) {
        finish(null);
        return;
      }
      ctx.drawImage(video, 0, 0, 640, 360);
      canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.82);
    };
  });
}
