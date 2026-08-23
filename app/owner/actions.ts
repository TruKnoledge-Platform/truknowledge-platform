"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabase } from "@supabase/supabase-js";
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

export async function pauseCourse(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = String(formData.get("id") || "");
  const teacherId = String(formData.get("teacherId") || "");
  const paused = String(formData.get("paused")) === "true";
  if (!id) redirect("/owner/people");
  await supabase.from("courses").update({ owner_paused: paused }).eq("id", id);
  redirect(`/owner/people/${teacherId}`);
}

export async function unlistTeacher(formData: FormData) {
  const { supabase } = await requireOwner();
  const teacherId = String(formData.get("teacherId") || "");
  if (!teacherId) redirect("/owner/people");
  await supabase
    .from("courses")
    .update({ owner_paused: true })
    .eq("teacher_id", teacherId);
  redirect(`/owner/people/${teacherId}`);
}

export async function relistTeacher(formData: FormData) {
  const { supabase } = await requireOwner();
  const teacherId = String(formData.get("teacherId") || "");
  if (!teacherId) redirect("/owner/people");
  await supabase
    .from("courses")
    .update({ owner_paused: false })
    .eq("teacher_id", teacherId);
  redirect(`/owner/people/${teacherId}`);
}

export async function unlistMember(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = String(formData.get("teacherId") || formData.get("id") || "");
  if (!id) redirect("/owner/people");
  await supabase.from("profiles").update({ is_paused: true }).eq("id", id);
  redirect(`/owner/people/${id}`);
}

export async function relistMember(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = String(formData.get("teacherId") || formData.get("id") || "");
  if (!id) redirect("/owner/people");
  await supabase.from("profiles").update({ is_paused: false }).eq("id", id);
  redirect(`/owner/people/${id}`);
}

export async function deleteCourse(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = String(formData.get("id") || "");
  const teacherId = String(formData.get("teacherId") || "");
  if (!id) redirect("/owner/people");
  await supabase.from("courses").delete().eq("id", id);
  redirect(`/owner/people/${teacherId}`);
}

export async function deleteTeacher(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const teacherId = String(formData.get("teacherId") || "");
  if (!teacherId || teacherId === user.id) {
    redirect("/owner/people");
  }

  await supabase.from("courses").delete().eq("teacher_id", teacherId);
  await supabase.from("teacher_profiles").delete().eq("user_id", teacherId);
  await supabase.from("profiles").delete().eq("id", teacherId);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && service) {
    const admin = createSupabase(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin.auth.admin.deleteUser(teacherId);
  }

  redirect("/owner/people");
}