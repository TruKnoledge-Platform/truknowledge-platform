"use client";

export default function WebAppQr({ url }: { url: string }) {
  if (!url) return null;

  const src =
    "https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=M&qzone=2&data=" +
    encodeURIComponent(url);

  async function download() {
    const res = await fetch(src);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "web-app-qr.png";
    a.click();
    URL.revokeObjectURL(href);
  }

  function printQr() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><title>Web App QR</title>
      <body style="font-family:Georgia,serif;text-align:center;padding:40px">
        <p style="word-break:break-all">${url}</p>
        <img src="${src}" width="320" height="320" alt="QR" />
        <script>window.onload=function(){window.print()}<\/script>
      </body>`);
    w.document.close();
  }

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <img
        src={src}
        alt="QR code for this Web App"
        className="h-40 w-40 rounded-xl bg-white p-2"
      />
      <div>
        <p className="text-sm text-slate-300">QR code for this Web App</p>
        <p className="mt-1 text-xs text-slate-400">
          A phone camera opens the course.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium hover:bg-orange-600"
          >
            Download
          </button>
          <button
            type="button"
            onClick={printQr}
            className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-400"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}