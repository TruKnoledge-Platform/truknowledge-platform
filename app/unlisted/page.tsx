import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { sendOwnerContact } from "./actions";

export default async function UnlistedPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_paused, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_paused || profile.role === "owner") {
    redirect("/learn");
  }

  const { sent } = await searchParams;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-lg">
        <h1
          className="text-3xl text-[#E8A24A]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Account unlisted
        </h1>
        <p className="mt-4 text-[16px] leading-7 text-[#F3E6D2]/85">
          You can still sign in, but this account cannot take courses right
          now. If you think this is a mistake, send a message below. The
          owner of TruKnowledge will read it.
        </p>

        {sent && (
          <p className="mt-6 text-sm text-[#E8A24A]">
            Message sent. You can wait here until the account is re-enlisted.
          </p>
        )}

        <form action={sendOwnerContact} className="mt-8 space-y-3">
          <label className="block text-sm text-[#9AA3B5]">
            Contact us
            <textarea
              name="body"
              required
              rows={5}
              placeholder="Tell us what happened"
              className="mt-2 w-full rounded-xl bg-[#12182A] px-4 py-3 text-[#F3E6D2]"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-[#E8A24A] px-6 py-3 font-medium text-[#0B1020]"
          >
            Send message
          </button>
        </form>

        <a href="/auth/signout" className="mt-8 inline-block text-sm text-[#9AA3B5]">
          Sign out
        </a>
      </div>
    </main>
  );
}