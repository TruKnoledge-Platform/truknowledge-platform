import { Resend } from "resend";

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || !opts.to) return { ok: false as const };

  const from =
    process.env.RESEND_FROM?.trim() ||
    "TruKnowledge <hello@truknowledge.center>";

  const resend = new Resend(key);
  const result = await resend.emails.send({
    from,
    to: [opts.to],
    replyTo: "nowliving.today@gmail.com",
    subject: opts.subject,
    text: opts.text,
  });

  if (result.error) return { ok: false as const };
  return { ok: true as const };
}