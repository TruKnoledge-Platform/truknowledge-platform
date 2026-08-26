"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";

function cleanHost(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .split(":")[0];
}

export async function markCnameLive(formData: FormData) {
  const { supabase } = await requireOwner();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) redirect("/owner/domains");

  const { data: order } = await supabase
    .from("domain_orders")
    .select("id, course_id, host")
    .eq("id", orderId)
    .maybeSingle();

  const host = cleanHost(order?.host || "");
  if (!order?.course_id || !host) redirect("/owner/domains");

  await supabase.from("courses").update({ custom_host: host }).eq("id", order.course_id);
  await supabase.from("domain_orders").update({ status: "live" }).eq("id", orderId);
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