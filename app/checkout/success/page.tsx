import Link from "next/link";
import Stripe from "stripe";
import SavePlace from "@/app/save-place";
import { fulfillCheckoutSession } from "@/lib/fulfill-checkout";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; next?: string }>;
}) {
  const { session_id, next } = await searchParams;
  const returnTo = next && next.startsWith("/") ? next : "/learn";

  if (!session_id || !process.env.STRIPE_SECRET_KEY) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold">Payment received</h1>
          <p className="mt-3 text-slate-400">
            We could not confirm the session. Check My courses or your Domain page.
          </p>
          <Link href={returnTo} className="mt-6 inline-block text-orange-400">
            Continue
          </Link>
        </div>
      </main>
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const isDomain = session.metadata?.kind === "domain";
  const courseId = session.metadata?.courseId || "";

  if (session.payment_status === "paid") {
    try {
      await fulfillCheckoutSession(session);
    } catch {
      // Webhook will retry if this page cannot write yet.
    }
  }

  if (isDomain) {
    return (
      <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#12182A] p-8">
          <p className="text-sm text-[#E8A24A]">Payment complete</p>
          <h1
            className="mt-2 text-3xl"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            We have your request
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#9AA3B5]">
            We are working on this and will respond within 48 hours. Thank you
            for your patronage and patience. A copy is also on its way to your
            email.
          </p>
          <Link
            href={returnTo}
            className="mt-6 inline-block rounded-full bg-[#E8A24A] px-6 py-3 font-medium text-[#0B1020]"
          >
            Back to Web App address
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      {courseId && <SavePlace courseId={courseId} />}
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-[#111827] p-8">
        <p className="text-sm text-orange-400">Payment complete</p>
        <h1 className="mt-2 text-3xl font-semibold">You’re enrolled</h1>
        <p className="mt-3 text-slate-400">You can open the course now.</p>
        <Link
          href={returnTo}
          className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium hover:bg-orange-600"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}