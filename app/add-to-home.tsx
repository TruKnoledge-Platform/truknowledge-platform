"use client";

import { useEffect, useState } from "react";

export default function AddToHome() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    function handlePrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as unknown as { prompt: () => Promise<void> });
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
      return;
    }
    setOpen((value) => !value);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
      >
        Add to Home Screen
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-700 bg-[#111827] p-4 text-left text-sm leading-6 text-slate-300">
          <p className="font-medium text-white">Add TruKnowledge to your home screen</p>
          <p className="mt-2">The icon opens My courses.</p>
          <p className="mt-3">
            <span className="text-orange-400">iPhone / iPad:</span> tap Share, then{" "}
            Add to Home Screen.
          </p>
          <p className="mt-2">
            <span className="text-orange-400">Android:</span> tap the browser menu,
            then Add to Home screen or Install app.
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