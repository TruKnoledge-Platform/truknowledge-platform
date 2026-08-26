import Link from "next/link";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";
import { sendMail } from "@/lib/send-mail";
import SavePlace from "@/app/save-place";

const KIND_WORDS: Record<string, string> = {
  cname_diy: "Choice 2 — you add the CNAME",
  cname_setup: "Choice 2 — we add the CNAME",
  domain_first: "Choice 3 — first course, we acquire the domain",
  domain_extra: "Choice 3 — extra course on that domain",
};

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDomain = session.metadata?.kind === "domain";
  const courseId = session.metadata?.courseId || "";
  const domainKind = session.metadata?.domainKind || "";
  const host = session.metadata?.host || "";
  const name1 = session.metadata?.name1 || "";
  const name2 = session.metadata?.name2 || "";
  const name3 = session.metadata?.name3 || "";
  const amount = (session.amount_total || 0) / 100;
  const kindLine = KIND_WORDS[domainKind] || domainKind;
  const namesLine = [name1, name2, name3].filter(Boolean).join(", ");

  if (user && session.payment_status === "paid" && isDomain) {
    const { data: already } = await supabase
      .from("domain_orders")
      .select("id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (!already) {
      await supabase.from("domain_orders").insert({
        teacher_id: user.id,
        course_id: courseId || null,
        kind: domainKind,
        host: host || null,
        name1: name1 || null,
        name2: name2 || null,
        name3: name3 || null,
        amount,
        stripe_session_id: session_id,
        status: "paid",
      });

      const teacherNote = [
        "Thank you for your payment.",
        "",
        "We are working on this and will respond within 48 hours.",
        "Thank you for your patronage and patience.",
        "",
        kindLine,
        host ? `Address: ${host}` : "",
        namesLine ? `Names: ${namesLine}` : "",
        `Amount: $${amount.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join("\n");

      if (user.email) {
        await sendMail({
          to: user.email,
          subject: "We have your Web App address request",
          text: teacherNote,
        });
      }

      const ownerTo = process.env.OWNER_EMAIL?.trim();
      if (ownerTo) {
        await sendMail({
          to: ownerTo,
          subject: `Domain order — ${kindLine}`,
          text: [
            "A teacher paid for a domain / address request.",
            "",
            `Teacher: ${user.email || user.id}`,
            kindLine,
            host ? `CNAME: ${host}` : "",
            namesLine ? `Names: ${namesLine}` : "",
            `Amount: $${amount.toFixed(2)}`,
            "",
            "Open Owner home → Domain orders.",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      }
    }
  }

  if (user && courseId && session.payment_status === "paid" && !isDomain) {
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
        amount,
        stripe_session_id: session_id,
      });
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