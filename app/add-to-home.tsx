"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void> };

export default function AddToHome({ accent = "#E8A24A" }: { accent?: string }) {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function handlePrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as InstallPrompt);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
      setOpen(false);
      return;
    }
    setOpen((value) => !value);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg border px-4 py-2 text-sm"
        style={{ borderColor: accent, color: accent }}
      >
        Home screen
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-700 bg-[#111827] p-4 text-left text-sm leading-6 text-slate-300">
          <p className="font-medium text-white">Save this course to your home screen</p>
          <p className="mt-2">The icon opens this course.</p>
          <p className="mt-3">
            <span style={{ color: accent }}>iPhone — Safari:</span> Share, then Add to
            Home Screen, then Add.
          </p>
          <p className="mt-2">
            <span style={{ color: accent }}>iPhone — Chrome:</span> Share, then Add to
            Home Screen.
          </p>
          <p className="mt-2">
            <span style={{ color: accent }}>iPhone — Brave:</span> menu, then Add to
            Home Screen.
          </p>
          <p className="mt-3">
            <span style={{ color: accent }}>Android — Chrome:</span> three dots, then
            Add to Home screen or Install app.
          </p>
          <p className="mt-2">
            <span style={{ color: accent }}>Android — Brave:</span> three dots, then
            Add to Home screen.
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
