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

  function ask(next: "domain_first" | "domain_extra") {
    setKind(next);
    setOpen(true);
  }

  const extraBlocked = kind === "domain_extra" && !hasSlug;
  const namesMissing = !name1.trim() || !name2.trim() || !name3.trim();

  return (
    <>
      <div className="mt-6 space-y-3">
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
            type="button"
            disabled={firstDisabled}
            onClick={() => ask("domain_first")}
            className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020] disabled:opacity-40"
          >
            {firstLabel}
          </button>
          <button
            type="button"
            disabled={extraDisabled}
            onClick={() => ask("domain_extra")}
            className="rounded-full border border-[#E8A24A] px-5 py-2 text-[#E8A24A] disabled:opacity-40"
          >
            {extraLabel}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E8A24A]/40 bg-[#12182A] p-6 text-[#F3E6D2]">
            <p className="text-lg text-[#E8A24A]">
              {kind === "domain_extra" ? "Extra course on your domain" : "We buy a domain"}
            </p>
            {kind === "domain_first" ? (
              <p className="mt-3 text-sm leading-6">
                We will try to buy one of your three names. All of your courses
                will live on that domain as folders (yourdomain.com/shortname).
                We reply within 48 hours.
              </p>
            ) : extraBlocked ? (
              <p className="mt-3 text-sm leading-6 text-red-300">
                Save a free short name (Choice 1) first. Extra courses use that
                as the folder: yourdomain.com/shortname
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6">
                This course will open at{" "}
                <span className="text-[#E8A24A]">
                  {bought || "yourdomain.com"}/{slug}
                </span>
                . This is the extra-course price, not a new domain.
              </p>
            )}
            {namesMissing && !extraBlocked && (
              <p className="mt-3 text-sm text-red-300">
                Enter three names, in order, then try again.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => 