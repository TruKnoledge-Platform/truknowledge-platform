"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireOwner } from "@/lib/is-owner";

export async function replyToContact(formData: FormData) {
  await requireOwner();

  const email = String(formData.get("email") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!email || !body) redirect("/owner/contact?err=1");

  const key = process.env.RESEND_API_KEY;
  if (!key) redirect("/owner/contact?err=mail");

  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM || "TruKnowledge <beth.t@example.com>",
    to: email,
    subject: "Reply from TruKnowledge",
    text: body,
  });

  if (result.error) {
    redirect("/owner/contact?err=mail");
  }

  redirect("/owner/contact?sent=1");
}