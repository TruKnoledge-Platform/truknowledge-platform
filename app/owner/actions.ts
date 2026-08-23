"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";

export async function saveFee(formData: FormData) {
  const { supabase } = await requireOwner();
  const fee = Number(formData.get("fee"));
  if (Number.isNaN(fee) || fee < 0 || fee > 90) {
    redirect("/owner");
  }

  await supabase.from("platform_settings").upsert({
    id: 1,
    fee_percent: fee,
    updated_at: new Date().toISOString(),
  });

  redirect("/owner");
}

export async function setPaused(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = String(formData.get("id") || "");
  const paused = String(formData.get("paused")) === "true";
  if (!id) redirect("/owner/people");

  await supabase.from("profiles").update({ is_paused: paused }).eq("id", id);
  redirect("/owner/people");
}

export async function deletePerson(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const id = String(formData.get("id") || "");
  if (!id || id === user.id) {
    redirect("/owner/people");
  }

  await supabase.from("profiles").delete().eq("id", id);
  redirect("/owner/people");
}