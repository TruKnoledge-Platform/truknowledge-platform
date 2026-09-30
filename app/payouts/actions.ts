"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { setPayoutSchedule, sendImmediatePayout } from "@/lib/teacher-payout";

export async function savePayoutSchedule(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/payouts");

  const raw = String(formData.get("schedule"));
  const schedule = raw === "instant" ? "instant" : "monthly";
  try {
    await setPayoutSchedule(user.id, schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the payout choice";
    redirect(`/payouts?error=${encodeURIComponent(message)}`);
  }
  redirect("/payouts");
}

export async function payNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/payouts");

  let result: { paid: number; fee: number; note: string } | null = null;
  try {
    result = await sendImmediatePayout(user.id, false);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Immediate payout failed";
    redirect(`/payouts?error=${encodeURIComponent(message)}`);
  }
  if (result && result.paid > 0) {
    redirect(
      `/payouts?sent=${encodeURIComponent(result.paid.toFixed(2))}&fee=${encodeURIComponent(result.fee.toFixed(2))}`
    );
  }
  if (result?.note) {
    redirect(`/payouts?error=${encodeURIComponent(result.note)}`);
  }
  redirect("/payouts");
}
