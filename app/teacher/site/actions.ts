"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

const RESERVED = new Set([
  "www",
  "app",
  "api",
  "mail",
  "owner",
  "teacher",
  "learn",
  "login",
  "signup",
  "site",
  "webapp",
  "checkout",
  "admin",
]);

function cleanSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveTeacherSite(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = String(formData.get("display_name") || "").trim();
  const slug = cleanSlug(String(formData.get("slug") || ""));

  if (!display_name || slug.length < 3 || slug.length > 32 || RESERVED.has(slug)) {
    redirect("/teacher/site?error=1");
  }

  const { data: taken } = await supabase
    .from("teacher_sites")
    .select("teacher_id")
    .eq("slug", slug)
    .maybeSingle();

  if (taken && taken.teacher_id !== user.id) {
    redirect("/teacher/site?error=taken");
  }

  const { data: existing } = await supabase
    .from("teacher_sites")
    .select("id")
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("teacher_sites")
      .update({
        display_name,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("teacher_id", user.id);
  } else {
    await supabase.from("teacher_sites").insert({
      teacher_id: user.id,
      display_name,
      slug,
      payment_mode: "stripe",
    });
  }

  redirect("/teacher/site?saved=1");
}