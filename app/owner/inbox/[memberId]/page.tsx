import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/is-owner";
import { replyToMember } from "../actions";

export default async function OwnerInboxThread({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const { supabase, user } = await requireOwner();

  const { data: person } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", memberId)
    .maybeSingle();

  if (!person) notFound();

  const { data: thread } = await supabase
    .from("owner_contacts")
    .select("id, sender_id, member_id, body, created_at")
    .or(`member_id.eq.${memberId},sender_id.eq.${memberId}`)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-lg">
        <a href="/owner/inbox" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to inbox
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {person.email || person.id}
        </h1>
        <a
          href={`/owner/people/${memberId}`}
          className="mt-2 inline-block text-sm text-[#E8A24A]"
        >
          Open this member
        </a>

        <div className="mt-8 space-y-3">
          {(thread || []).map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-white/10 bg-[#12182A] p-4"
            >
              <p className="text-xs text-[#9AA3B5]">
                {note.sender_id === user.id ? "You" : "Member"} ·{" "}
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>

        <form action={replyToMember} className="mt-6 space-y-3">
          <input type="hidden" name="memberId" value={memberId} />
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Reply to this member"
            className="w-full rounded-xl bg-[#12182A] px-4 py-3"
          />
          <button
            type="submit"
            className="rounded-full bg-[#E8A24A] px-6 py-3 font-medium text-[#0B1020]"
          >
            Send reply
          </button>
        </form>
      </div>
    </main>
  );
}