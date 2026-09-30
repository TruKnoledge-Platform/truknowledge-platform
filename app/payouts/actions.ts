"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { setPayoutSchedule } from "@/lib/teacher-payout";

export async function savePayoutSchedule(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/payouts");

  const schedule = formData.get("schedule") === "daily" ? "daily" : "monthly";
  try {
    await setPayoutSchedule(user.id, schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the payout choice";
    redirect(`/payouts?error=${encodeURIComponent(message)}`);
  }
  redirect("/payouts");
}
