import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { refreshTeacher } from "@/lib/teacher-payout";
import { savePayoutSchedule, payNow } from "./actions";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; fee?: string }>;
}) {
  const { error, sent, fee } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/payouts");

  const status = await refreshTeacher(user.id);
  const keep = 100 - status.feePercent;

  return (
    <main className="min-h-screen bg-[#0B1220] px-6 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher home
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Payouts</h1>
        <p className="mt-3 text-slate-400">
          You keep {keep}% of each paid enrollment. TruKnowledge keeps{" "}
          {status.feePercent}%, and Stripe keeps its card fee. Monthly and Daily
          add no extra TruKnowledge fee. Immediate costs $
          {status.instantFee.toFixed(2)} each time the balance is sent, plus
          Stripe’s own instant fee of about 1%.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {!status.connected && (
          <p className="mt-6 text-sm text-slate-400">
            Not connected yet. Click the button below. Stripe will ask for the
            bank account the money should go to.
          </p>
        )}

        {status.connected && !status.chargesEnabled && (
          <p className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm text-slate-300">
            Stripe is connected, but it is still confirming the account. Sales
            are saved. Your share is sent after Stripe says the account can
            receive money. If Stripe asked for more information, use the button
            below.
          </p>
        )}

        {status.chargesEnabled && (
          <p className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm text-slate-300">
            Stripe can receive payouts
            {status.payoutsEnabled ? "." : ". Payouts to the bank are still being confirmed."}
            {" "}
            New sales send your share to Stripe. Monthly sends the bank payment
            on the 1st. Daily sends it each day the money is available. Immediate
            sends it in minutes and costs ${status.instantFee.toFixed(2)} each
            time. Opening this page also sends your share of any earlier sales
            that stayed on TruKnowledge.
          </p>
        )}

        {status.instantPaid > 0 && (
          <p className="mt-4 text-sm text-orange-300">
            Sent ${status.instantPaid.toFixed(2)} immediately.
            {status.instantServiceFee > 0
              ? ` Service fee $${status.instantServiceFee.toFixed(2)}.`
              : ""}
          </p>
        )}

        {sent && (
          <p className="mt-4 text-sm text-orange-300">
            Sent ${sent} immediately{fee && Number(fee) > 0 ? `. Service fee $${fee}.` : "."}
          </p>
        )}

        {status.sentCount > 0 && (
          <p className="mt-4 text-sm text-orange-300">
            Sent ${status.sentAmount.toFixed(2)} from {status.sentCount}{" "}
            {status.sentCount === 1 ? "sale" : "sales"} to your Stripe account.
          </p>
        )}

        {status.note && (
          <p className="mt-2 text-sm text-slate-400">{status.note}</p>
        )}

        {status.waiting > 0 && (
          <p className="mt-2 text-sm text-slate-400">
            {status.waiting} {status.waiting === 1 ? "sale is" : "sales are"} still
            waiting. Stripe may still be releasing the card payment. Open this page
            again later.
          </p>
        )}

        <a
          href="/api/stripe/connect"
          className="mt-6 inline-block rounded-lg bg-orange-500 px-5 py-3 font-medium hover:bg-orange-600"
        >
          {status.connected ? "Continue Stripe setup" : "Connect Stripe"}
        </a>

        {status.chargesEnabled && (
          <form action={savePayoutSchedule} className="mt-8 space-y-3">
            <p className="text-sm font-medium">When Stripe pays your bank</p>
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm">
              <input
                type="radio"
                name="schedule"
                value="monthly"
                defaultChecked={status.schedule === "monthly"}
              />
              <span>
                <span className="block font-medium">Monthly</span>
                <span className="mt-1 block text-slate-400">
                  Stripe sends the balance on the 1st. No extra fee.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm">
              <input
                type="radio"
                name="schedule"
                value="daily"
                defaultChecked={status.schedule === "daily"}
              />
              <span>
                <span className="block font-medium">Daily</span>
                <span className="mt-1 block text-slate-400">
                  Stripe sends the balance each day it is available. Card
                  payments still take about two days to clear. No extra
                  TruKnowledge fee.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm">
              <input
                type="radio"
                name="schedule"
                value="instant"
                defaultChecked={status.schedule === "instant"}
              />
              <span>
                <span className="block font-medium">Immediate</span>
                <span className="mt-1 block text-slate-400">
                  Sends the available balance in minutes. Extra charge: $
                  {status.instantFee.toFixed(2)} each time, kept by TruKnowledge,
                  plus about 1% kept by Stripe. A debit card must be on the
                  Stripe account. Card payments still take about two days before
                  they can be sent.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="rounded-lg border border-orange-500 px-4 py-2 text-sm text-orange-300"
            >
              Save payout choice
            </button>
          </form>
        )}

        {status.chargesEnabled && status.schedule === "instant" && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <form action={payNow}>
              <button
                type="submit"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium"
              >
                Send available balance now
              </button>
            </form>
            <a href="/api/stripe/express" className="text-sm text-orange-300 hover:underline">
              Open Stripe to add a debit card
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
