"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";

export async function replyToMember(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const memberId = String(formData.get("memberId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!memberId || !body) redirect("/owner/inbox");

  await supabase.from("owner_contacts").insert({
    sender_id: user.id,
    member_id: memberId,
    body,
  });

  redirect(`/owner/inbox/${memberId}`);
}