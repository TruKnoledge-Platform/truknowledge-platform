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

  const { data: thread } = await supabase
    .from("owner_contacts")
    .select("id, sender_id, member_id, body, created_at")
    .or(`member_id.eq.${user.id},sender_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

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
          now. The full message chain with TruKnowledge is below.
        </p>

        <div className="mt-8 space-y-3">
          {(thread || []).map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-white/10 bg-[#12182A] p-4"
            >
              <p className="text-xs text-[#9AA3B5]">
                {note.sender_id === user.id ? "You" : "TruKnowledge"} ·{" "}
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
          {!thread?.length && (
            <p className="text-sm text-[#9AA3B5]">No messages yet.</p>
          )}
        </div>

        {sent && (
          <p className="mt-4 text-sm text-[#E8A24A]">Message sent.</p>
        )}

        <form action={sendOwnerContact} className="mt-6 space-y-3">
          <label className="block text-sm text-[#9AA3B5]">
            Write a message
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