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

function cleanHost(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/\.$/, "");
}

export async function saveTeacherSite(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = String(formData.get("display_name") || "").trim();
  const slug = cleanSlug(String(formData.get("slug") || ""));
  const hostRaw = String(formData.get("custom_host") || "").trim();
  const custom_host = hostRaw ? cleanHost(hostRaw) : null;

  if (!display_name || slug.length < 3 || slug.length > 32 || RESERVED.has(slug)) {
    redirect("/teacher/site?error=1");
  }

  if (custom_host) {
    const labels = custom_host.split(".");
    const ok =
      labels.length >= 3 &&
      /^[a-z0-9.-]+$/.test(custom_host) &&
      !custom_host.includes("truknowledge.center") &&
      !custom_host.endsWith(".vercel.app");
    if (!ok) redirect("/teacher/site?error=host");
  }

  const { data: taken } = await supabase
    .from("teacher_sites")
    .select("teacher_id")
    .eq("slug", slug)
    .maybeSingle();

  if (taken && taken.teacher_id !== user.id) {
    redirect("/teacher/site?error=taken");
  }

  if (custom_host) {
    const { data: hostTaken } = await supabase
      .from("teacher_sites")
      .select("teacher_id")
      .eq("custom_host", custom_host)
      .maybeSingle();
    if (hostTaken && hostTaken.teacher_id !== user.id) {
      redirect("/teacher/site?error=taken");
    }
  }

  const { data: existing } = await supabase
    .from("teacher_sites")
    .select("id")
    .eq("teacher_id", user.id)
    .maybeSingle();

  const row = {
    display_name,
    slug,
    custom_host,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("teacher_sites").update(row).eq("teacher_id", user.id);
  } else {
    await supabase.from("teacher_sites").insert({
      teacher_id: user.id,
      payment_mode: "stripe",
      ...row,
    });
  }

  redirect("/teacher/site?saved=1");
}