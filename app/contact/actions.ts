"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function sendSiteContact(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!email || !body) redirect("/contact?err=1");

  await supabase.from("site_contacts").insert({
    user_id: user?.id || null,
    name: name || null,
    email,
    body,
  });

  redirect("/contact?sent=1");
}