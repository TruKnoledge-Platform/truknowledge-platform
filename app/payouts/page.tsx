"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function PayoutsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [payoutSpeed, setPayoutSpeed] = useState("monthly");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      }).catch(() => null);

      const { data } = await supabase
        .from("teacher_profiles")
        .select("stripe_account_id, charges_enabled, payout_speed")
        .eq("user_id", user.id)
        .maybeSingle();

      setAccountId(data?.stripe_account_id || "");
      setChargesEnabled(Boolean(data?.charges_enabled));
      setPayoutSpeed(data?.payout_speed || "monthly");
      setLoading(false);
    }

    load();
  }, []);

  async function connectStripe() {
    setConnecting(true);
    setError("");
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "onboard" }),
    });
    const data = await res.json();
    setConnecting(false);
    if (!res.ok || !data.url) {
      setError(data.error || "Could not start Stripe Connect");
      return;
    }
    window.location.href = data.url;
  }

  async function saveSpeed(speed: string) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payout_speed", payout_speed: speed }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save payout speed");
      return;
    }
    setPayoutSpeed(speed);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher area
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Payouts</h1>
        <p className="mt-2 text-slate-400">
          Connect Stripe to receive your share of paid enrollments. TruKnowledge
          keeps a 10% platform fee.
        </p>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <h2 className="text-lg font-medium">Stripe account</h2>
          <p className="mt-2 text-sm text-slate-400">
            {accountId
              ? chargesEnabled
                ? "Connected and ready to receive payouts."
                : "Started, but Stripe onboarding is not finished yet."
              : "Not connected yet."}
          </p>
          {accountId && (
            <p className="mt-2 text-xs text-slate-500">Account: {accountId}</p>
          )}
          <button
            type="button"
            onClick={connectStripe}
            disabled={connecting}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {connecting
              ? "Opening Stripe..."
              : accountId
                ? "Continue Stripe setup"
                : "Connect Stripe"}
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-6">
          <h2 className="text-lg font-medium">Payout speed</h2>
          <p className="mt-2 text-sm text-slate-400">
            Monthly is standard. Faster (daily) may include extra Stripe fees.
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="speed"
                checked={payoutSpeed === "monthly"}
                onChange={() => saveSpeed("monthly")}
                disabled={saving || !accountId}
              />
              Monthly
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="speed"
                checked={payoutSpeed === "immediate"}
                onChange={() => saveSpeed("immediate")}
                disabled={saving || !accountId}
              />
              Faster / more immediate
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}