"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { requireOwner } from "@/lib/is-owner";

export async function replyToContact(formData: FormData) {
  await requireOwner();

  const email = String(formData.get("email") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!email || !body) redirect("/owner/contact?err=missing");

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    redirect(
      "/owner/contact?err=" +
        encodeURIComponent("RESEND_API_KEY is missing on Vercel")
    );
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "TruKnowledge <hello@truknowledge.center>";

  const resend = new Resend(key);
  const result = await resend.emails.send({
    from,
    to: [email],
    subject: "Reply from TruKnowledge",
    text: body,
  });

  if (result.error) {
    const msg = String(
      result.error.message || result.error.name || "Resend refused the send"
    ).slice(0, 200);
    redirect("/owner/contact?err=" + encodeURIComponent(msg));
  }

  redirect("/owner/contact?sent=1");
}