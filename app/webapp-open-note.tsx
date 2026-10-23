"use client";

import { useEffect, useState } from "react";

function storageKey(courseId: string) {
  return `tk-hide-open-note:${courseId}`;
}

export default function WebAppOpenNote({
  courseId,
  accent = "#E8A24A",
}: {
  courseId: string;
  accent?: string;
}) {
  const [show, setShow] = useState(false);
  const [hideNext, setHideNext] = useState(false);
  const [ios, setIos] = useState(false);
  const [safari, setSafari] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(iosDevice);
    setSafari(iosDevice && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua));
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    );

    try {
      if (localStorage.getItem(storageKey(courseId)) === "1") return;
    } catch {
      return;
    }
    setShow(true);
  }, [courseId]);

  function onHideNext(checked: boolean) {
    setHideNext(checked);
    try {
      if (checked) localStorage.setItem(storageKey(courseId), "1");
      else localStorage.removeItem(storageKey(courseId));
    } catch {
      // the note can still be closed for this visit
    }
  }

  if (!show || !courseId) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-700 bg-[#111827] p-5 text-left text-sm leading-6 text-slate-300">
      <p className="font-medium text-white">When you open this course</p>
      {installed ? (
        <p className="mt-2">
          You opened it from your home screen. It starts where you left off. The
          icon is only for this course.
        </p>
      ) : (
        <>
          <p className="mt-2">
            You can keep this course on your home screen. The icon opens this
            course, like an app, on the phone you already have.
          </p>
          {ios ? (
            safari ? (
              <p className="mt-3">
                <span style={{ color: accent }}>iPhone / iPad:</span> in Safari, tap
                Share (the square with an arrow), then Add to Home Screen, then Add.
              </p>
            ) : (
              <p className="mt-3">
                <span style={{ color: accent }}>iPhone / iPad:</span> open this page
                in Safari first. Then tap Share, then Add to Home Screen.
              </p>
            )
          ) : (
            <p className="mt-3">
              <span style={{ color: accent }}>Android:</span> tap Home screen next
              to Share, or the browser menu (three dots), then Add to Home screen
              or Install app.
            </p>
          )}
        </>
      )}
      <label className="mt-4 flex items-start gap-3 text-slate-200">
        <input
          type="checkbox"
          className="mt-1"
          checked={hideNext}
          onChange={(event) => onHideNext(event.target.checked)}
        />
        <span>Do not show this message when opening the app</span>
      </label>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="mt-4 rounded-lg border px-4 py-2 text-sm"
        style={{ borderColor: accent, color: accent }}
      >
        Close
      </button>
    </div>
  );
}
