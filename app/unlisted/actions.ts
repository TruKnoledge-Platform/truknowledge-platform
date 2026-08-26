"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function sendOwnerContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const body = String(formData.get("body") || "").trim();
  if (!body) redirect("/unlisted");

  await supabase.from("owner_contacts").insert({
    sender_id: user.id,
    member_id: user.id,
    body,
  });

  redirect("/unlisted?sent=1");
}