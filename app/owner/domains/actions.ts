"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";
import { sendMail } from "@/lib/send-email";

function cleanHost(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .split(":")[0];
}

async function notifyLive(opts: {
  supabase: Awaited<ReturnType<typeof requireOwner>>["supabase"];
  teacherId: string;
  courseId?: string | null;
  address: string;
  kindLine: string;
}) {
  const { data: person } = await opts.supabase
    .from("profiles")
    .select("email")
    .eq("id", opts.teacherId)
    .maybeSingle();

  let courseTitle = "";
  if (opts.courseId) {
    const { data: course } = await opts.supabase
      .from("courses")
      .select("title")
      .eq("id", opts.courseId)
      .maybeSingle();
    courseTitle = course?.title || "";
  }

  const link = opts.address.startsWith("http")
    ? opts.address
    : `https://${opts.address}`;

  const teacherNote = [
    "Your custom address is live.",
    "",
    courseTitle ? `Course: ${courseTitle}` : "",
    opts.kindLine,
    `Learners can open: ${link}`,
    "",
    "We will reply if anything still needs a tweak.",
    "Thanks for being part of Team TruKnowledge!",
  ]
    .filter((line) => line !== "")
    .join("\n");

  try {
    if (person?.email) {
      await sendMail({
        to: person.email,
        subject: "Your Web App address is live",
        text: teacherNote,
      });
    }
    const ownerTo = process.env.OWNER_EMAIL?.trim();
    if (ownerTo) {
      await sendMail({
        to: ownerTo,
        subject: `LIVE — ${opts.kindLine}`,
        text: [
          "You marked this address live.",
          "",
          `Teacher: ${person?.email || opts.teacherId}`,
          courseTitle ? `Course: ${courseTitle}` : "",
          opts.kindLine,
          `Link: ${link}`,
        ]
          .filter((line) => line !== "")
          .join("\n"),
      });
    }
  } catch {
    // Mark live still stands if mail fails.
  }
}

export async function markCnameLive(formData: FormData) {
  const { supabase } = await requireOwner();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/owner/domains");

  const { data: order } = await supabase
    .from("domain_orders")
    .select("id, teacher_id, course_id, host")
    .eq("id", orderId)
    .maybeSingle();

  const host = cleanHost(order?.host || "");
  if (!order?.course_id || !order.teacher_id || !host) {
    redirect("/owner/domains");
  }

  await supabase
    .from("courses")
    .update({ custom_host: host })
    .eq("id", order.course_id);
  await supabase.from("domain_orders").update({ status: "live" }).eq("id", orderId);

  await notifyLive({
    supabase,
    teacherId: order.teacher_id,
    courseId: order.course_id,
    address: host,
    kindLine: "Choice 2 — CNAME",
  });

  redirect("/owner/domains");
}

export async function markBoughtLive(formData: FormData) {
  const { supabase } = await requireOwner();
  const orderId = String(formData.get("orderId") || "");
  const domain = cleanHost(String(formData.get("domain") || ""));
  if (!orderId || !domain) redirect("/owner/domains");

  const { data: order } = await supabase
    .from("domain_orders")
    .select("id, teacher_id, course_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order?.teacher_id) redirect("/owner/domains");

  await supabase
    .from("teacher_profiles")
    .update({ bought_domain: domain })
    .eq("user_id", order.teacher_id);

  await supabase
    .from("domain_orders")
    .update({ status: "live", chosen_domain: domain })
    .eq("id", orderId);

  const { data: course } = order.course_id
    ? await supabase
        .from("courses")
        .select("webapp_slug")
        .eq("id", order.course_id)
        .maybeSingle()
    : { data: null };

  const address = course?.webapp_slug
    ? `${domain}/${course.webapp_slug}`
    : domain;

  await notifyLive({
    supabase,
    teacherId: order.teacher_id,
    courseId: order.course_id,
    address,
    kindLine: "Choice 3 — acquired domain",
  });

  redirect("/owner/domains");
}

export async function markExtraLive(formData: FormData) {
  const { supabase } = await requireOwner();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/owner/domains");

  const { data: order } = await supabase
    .from("domain_orders")
    .select("id, teacher_id, course_id, kind")
    .eq("id", orderId)
    .maybeSingle();
  if (!order?.teacher_id || !order.course_id || order.kind !== "domain_extra") {
    redirect("/owner/domains");
  }

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("bought_domain")
    .eq("user_id", order.teacher_id)
    .maybeSingle();
  const { data: course } = await supabase
    .from("courses")
    .select("webapp_slug")
    .eq("id", order.course_id)
    .maybeSingle();

  if (!teacher?.bought_domain || !course?.webapp_slug) {
    redirect("/owner/domains");
  }

  await supabase.from("domain_orders").update({ status: "live" }).eq("id", orderId);

  await notifyLive({
    supabase,
    teacherId: order.teacher_id,
    courseId: order.course_id,
    address: `${teacher.bought_domain}/${course.webapp_slug}`,
    kindLine: "Choice 3 — extra course",
  });

  redirect("/owner/domains");
}

export async function suggestNames(formData: FormData) {
  const { supabase } = await requireOwner();
  const orderId = String(formData.get("orderId") || "");
  const suggested1 = String(formData.get("suggested1") || "").trim();
  const suggested2 = String(formData.get("suggested2") || "").trim();
  const suggested3 = String(formData.get("suggested3") || "").trim();
  if (!orderId || !suggested1 || !suggested2 || !suggested3) {
    redirect("/owner/domains");
  }

  await supabase
    .from("domain_orders")
    .update({
      suggested1,
      suggested2,
      suggested3,
      status: "waiting_choice",
    })
    .eq("id", orderId);

  redirect("/owner/domains");
}