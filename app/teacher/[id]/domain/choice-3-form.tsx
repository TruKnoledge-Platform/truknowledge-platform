"use client";

import { useState } from "react";
import { startDomainCheckout } from "./actions";

export default function Choice3Form({
  courseId,
  hasSlug,
  slug,
  bought,
  firstLabel,
  extraLabel,
  firstDisabled,
  extraDisabled,
}: {
  courseId: string;
  hasSlug: boolean;
  slug: string;
  bought: string;
  firstLabel: string;
  extraLabel: string;
  firstDisabled: boolean;
  extraDisabled: boolean;
}) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [name3, setName3] = useState("");
  const [kind, setKind] = useState<"domain_first" | "domain_extra" | null>(null);
  const [open, setOpen] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const next = submitter?.value;
    if (next !== "domain_first" && next !== "domain_extra") return;
    setKind(next);
    setOpen(true);
  }

  const extraBlocked = kind === "domain_extra" && !hasSlug;

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm">
          First choice
          <input
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Second choice
          <input
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Third choice
          <input
            value={name3}
            onChange={(e) => setName3(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg bg-[#0B1020] px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            name="kind"
            value="domain_first"
            disabled={firstDisabled}
            className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020] disabled:opacity-40"
          >
            {firstLabel}
          </button>
          <button
            type="submit"
            name="kind"
            value="domain_extra"
            disabled={extraDisabled}
            className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A] disabled:opacity-40"
          >
            {extraLabel}
          </button>
        </div>
      </form>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E8A24A]/40 bg-[#12182A] p-6 text-[#F3E6D2]">
            <p className="text-lg text-[#E8A24A]">
              {kind === "domain_extra" ? "Extra course on your domain" : "We acquire a domain"}
            </p>
            {kind === "domain_extra" && extraBlocked ? (
              <p className="mt-3 text-sm leading-6 text-red-300">
                Save a free short name (Choice 1) first. Extra courses use that
                as the folder: yourdomain.com/shortname
              </p>
            ) : kind === "domain_extra" ? (
              <p className="mt-3 text-sm leading-6">
                This course will open at{" "}
                <span className="text-[#E8A24A]">
                  {bought || "yourdomain.com"}/{slug}
                </span>
                . This is the extra-course price, not a new domain.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6">
                We will try to acquire one of your three names. All of your
                courses will live on that domain as folders
                (yourdomain.com/shortname). We reply within 48 hours.
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
              {kind && !extraBlocked && (
                <form action={startDomainCheckout}>
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="name1" value={name1} />
                  <input type="hidden" name="name2" value={name2} />
                  <input type="hidden" name="name3" value={name3} />
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