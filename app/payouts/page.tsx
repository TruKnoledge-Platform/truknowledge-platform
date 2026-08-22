import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/payouts");
  }

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("stripe_account_id, charges_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  const connected = Boolean(teacher?.stripe_account_id);

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      <div className="mx-auto max-w-xl">
        <a href="/teacher" className="text-sm text-slate-400 hover:text-white">
          Back to teacher home
        </a>
        <h1 className="mt-4 text-3xl font-semibold">Payouts</h1>
        <p className="mt-3 text-slate-400">
          Connect Stripe to receive your share of paid enrollments. TruKnowledge
          keeps a 10% platform fee.
        </p>

        {connected ? (
          <p className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4 text-sm text-slate-300">
            {teacher?.charges_enabled
              ? "Stripe is connected and can receive payouts."
              : "Stripe is connected. Confirmation can still take a while."}
          </p>
        ) : (
          <p className="mt-6 text-sm text-slate-400">
            Not connected yet. Click the button below.
          </p>
        )}

        <a
          href="/api/stripe/connect"
          className="mt-6 inline-block rounded-lg bg-orange-500 px-5 py-3 font-medium hover:bg-orange-600"
        >
          {connected ? "Continue Stripe setup" : "Connect Stripe"}
        </a>
      </div>
    </main>
  );
}