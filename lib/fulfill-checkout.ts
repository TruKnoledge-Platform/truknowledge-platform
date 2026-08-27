import Stripe from "stripe";
import { createAdmin } from "@/lib/supabase-admin";
import { sendMail } from "@/lib/send-email";

const KIND_WORDS: Record<string, string> = {
  cname_diy: "Choice 2 — you add the CNAME",
  cname_setup: "Choice 2 — we add the CNAME",
  domain_first: "Choice 3 — first course, we acquire the domain",
  domain_extra: "Choice 3 — extra course on that domain",
};

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  const meta = session.metadata || {};
  const sessionId = session.id;
  const amount = (session.amount_total || 0) / 100;
  const supabase = createAdmin();

  if (meta.kind === "domain") {
    const { data: already } = await supabase
      .from("domain_orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (already) return;

    const teacherId = meta.userId || "";
    const domainKind = meta.domainKind || "";
    const host = meta.host || "";
    const name1 = meta.name1 || "";
    const name2 = meta.name2 || "";
    const name3 = meta.name3 || "";
    const courseId = meta.courseId || "";
    const namesLine = [name1, name2, name3].filter(Boolean).join(", ");
    const kindLine = KIND_WORDS[domainKind] || domainKind;

    await supabase.from("domain_orders").insert({
      teacher_id: teacherId || null,
      course_id: courseId || null,
      kind: domainKind,
      host: host || null,
      name1: name1 || null,
      name2: name2 || null,
      name3: name3 || null,
      amount,
      stripe_session_id: sessionId,
      status: "paid",
    });

    const { data: person } = teacherId
      ? await supabase.from("profiles").select("email").eq("id", teacherId).maybeSingle()
      : { data: null };

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

    if (person?.email) {
      await sendMail({
        to: person.email,
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
          `Teacher: ${person?.email || teacherId}`,
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
    return;
  }

  const courseId = meta.courseId || "";
  const userId = meta.userId || "";
  if (!courseId || !userId) return;

  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrolled) {
    await supabase.from("enrollments").insert({
      user_id: userId,
      course_id: courseId,
      status: "active",
    });
  }

  const { data: paid } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!paid) {
    const { data: course } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", courseId)
      .maybeSingle();

    if (course?.teacher_id) {
      await supabase.from("payments").insert({
        course_id: courseId,
        teacher_id: course.teacher_id,
        user_id: userId,
        amount,
        stripe_session_id: sessionId,
      });
    }
  }
}