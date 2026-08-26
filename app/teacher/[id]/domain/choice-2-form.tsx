"use client";

import { useState } from "react";
import { startDomainCheckout } from "./actions";

function hostLooksOk(raw: string) {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .split(":")[0];
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 3) return false;
  if (parts[0] === "www") return false;
  if (host.endsWith("truknowledge.center")) return false;
  if (host.endsWith("vercel.app")) return false;
  return true;
}

export default function Choice2Form({
  courseId,
  diyLabel,
  setupLabel,
  diyDisabled,
  setupDisabled,
}: {
  courseId: string;
  diyLabel: string;
  setupLabel: string;
  diyDisabled: boolean;
  setupDisabled: boolean;
}) {
  const [host, setHost] = useState("");
  const [kind, setKind] = useState<"cname_diy" | "cname_setup" | null>(null);
  const [open, setOpen] = useState(false);
  const [bad, setBad] = useState(false);

  function ask(next: "cname_diy" | "cname_setup") {
    setKind(next);
    setBad(!hostLooksOk(host));
    setOpen(true);
  }

  return (
    <>
      <div className="mt-6 space-y-4">
        <label className="block text-sm">
          Sub-address you want (example: app.yoursite.com)
          <input
            name="host"
            required
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="app.yoursite.com"
            className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={diyDisabled}
            onClick={() => ask("cname_diy")}
            className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020] disabled:opacity-40"
          >
            {diyLabel}
          </button>
          <button
            type="button"
            disabled={setupDisabled}
            onClick={() => ask("cname_setup")}
            className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A] disabled:opacity-40"
          >
            {setupLabel}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E8A24A]/40 bg-[#12182A] p-6 text-[#F3E6D2]">
            <p className="text-lg text-[#E8A24A]">Keep your homepage</p>
            <p className="mt-3 text-sm leading-6">
              Use a sub-address like{" "}
              <span className="text-[#E8A24A]">app.yoursite.com</span> — not
              yoursite.com and not www.yoursite.com. That keeps your homepage as
              it is.
            </p>
            {bad && (
              <p className="mt-3 text-sm text-red-300">
                Change the address to a sub-address first, then try again.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/20 px-5 py-2"
              >
                Cancel
              </button>
              {!bad && kind && (
                <form action={startDomainCheckout}>
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="host" value={host} />
                  <input type="hidden" name="kind" value={kind} />
                  <button
                    type="submit"
                    className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
                  >
                    Continue to payment
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}