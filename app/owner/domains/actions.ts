"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";

function cleanHost(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
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