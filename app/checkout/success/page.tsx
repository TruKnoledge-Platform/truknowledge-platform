import Link from "next/link";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";
import SavePlace from "@/app/save-place";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; next?: string }>;
}) {
  const { session_id, next } = await searchParams;
  const returnTo = next && next.startsWith("/") ? next : "/learn";
  let courseId = "";

  if (!session_id || !process.env.STRIPE_SECRET_KEY) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold">Payment received</h1>
          <p className="mt-3 text-slate-400">
            We could not confirm the session, but you can check My courses.
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
  courseId = session.metadata?.courseId || "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && courseId && session.payment_status === "paid") {
    await supabase.from("enrollments").insert({
      user_id: user.id,
      course_id: courseId,
      status: "active",
    });

    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", courseId)
      .single();

    if (course?.teacher_id) {
      await supabase.from("payments").insert({
        course_id: courseId,
        teacher_id: course.teacher_id,
        user_id: user.id,
        amount: (session.amount_total || 0) / 100,
        stripe_session_id: session_id,
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white px-6 py-10">
      {courseId && <SavePlace courseId={courseId} />}
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-[#111827] p-8">
        <p className="text-sm text-orange-400">Payment complete</p>
        <h1 className="mt-2 text-3xl font-semibold">You’re enrolled</h1>
        <p className="mt-3 text-slate-400">
          This was a Stripe test payment. You can open the course now.
        </p>
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