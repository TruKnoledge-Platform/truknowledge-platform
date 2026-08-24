"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

function cleanSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function saveWebAppSlug(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = String(formData.get("courseId") || "");
  const slug = cleanSlug(String(formData.get("slug") || ""));
  if (!courseId) redirect("/teacher");
  if (!slug) redirect(`/teacher/${courseId}/domain?err=name`);

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!course) redirect("/teacher");

  const { data: taken } = await supabase
    .from("courses")
    .select("id")
    .eq("webapp_slug", slug)
    .neq("id", courseId)
    .maybeSingle();
  if (taken) redirect(`/teacher/${courseId}/domain?err=taken`);

  await supabase.from("courses").update({ webapp_slug: slug }).eq("id", courseId);
  redirect(`/teacher/${courseId}/domain?ok=1`);
}