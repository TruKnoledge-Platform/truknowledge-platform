import { createClient } from "@/lib/supabase-server";
import { sendSiteContact } from "./actions";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; err?: string }>;
}) {
  const { sent, err } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-lg">
        <a href="/" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to home
        </a>
        <h1
          className="mt-4 text-3xl text-[#E8A24A]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Contact us
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9AA3B5]">
          Questions about courses, the Web App, or a domain name. We read these
          in the owner back office.
        </p>

        {sent && (
          <p className="mt-4 text-sm text-[#E8A24A]">
            Sent. Thank you — we will reply by email.
          </p>
        )}
        {err && (
          <p className="mt-4 text-sm text-red-300">
            Enter your email and a message.
          </p>
        )}

        <form action={sendSiteContact} className="mt-8 space-y-4">
          <label className="block text-sm">
            Name
            <input
              name="name"
              className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={user?.email || ""}
              className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Message
            <textarea
              name="body"
              required
              rows={6}
              className="mt-1 block w-full rounded-lg bg-[#12182A] px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}