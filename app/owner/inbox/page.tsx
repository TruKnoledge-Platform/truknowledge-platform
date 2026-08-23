import { requireOwner } from "@/lib/is-owner";
import { replyToMember } from "./actions";

export default async function OwnerInbox() {
  const { supabase } = await requireOwner();
  const { data: notes } = await supabase
    .from("owner_contacts")
    .select("id, sender_id, member_id, body, created_at")
    .order("created_at", { ascending: false });

  const memberIds = [
    ...new Set(
      (notes || [])
        .map((n) => n.member_id || n.sender_id)
        .filter((id): id is string => !!id)
    ),
  ];

  const { data: people } =
    memberIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", memberIds)
      : { data: [] };

  const emailOf = (id: string) =>
    people?.find((p) => p.id === id)?.email || id;

  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F3E6D2] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/owner" className="text-sm text-[#9AA3B5] hover:text-white">
          Back to owner home
        </a>
        <h1
          className="mt-4 text-3xl"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Messages from unlisted members
        </h1>

        <div className="mt-8 space-y-8">
          {memberIds.map((memberId) => {
            const thread = (notes || [])
              .filter((n) => (n.member_id || n.sender_id) === memberId)
              .slice()
              .reverse();

            return (
              <section
                key={memberId}
                className="rounded-xl border border-white/10 bg-[#12182A] p-4"
              >
                <p className="text-[#E8A24A]">{emailOf(memberId)}</p>
                <a
                  href={`/owner/people/${memberId}`}
                  className="text-xs text-[#9AA3B5] hover:text-white"
                >
                  Open this member
                </a>

                <div className="mt-4 space-y-3">
                  {thread.map((note) => (
                    <div key={note.id} className="rounded-lg bg-[#0B1020] p-3">
                      <p className="text-xs text-[#9AA3B5]">
                        {note.sender_id === memberId ? "Member" : "You"} ·{" "}
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))}
                </div>

                <form action={replyToMember} className="mt-4 space-y-3">
                  <input type="hidden" name="memberId" value={memberId} />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder="Reply to this member"
                    className="w-full rounded-xl bg-[#0B1020] px-4 py-3"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#E8A24A] px-5 py-2 font-medium text-[#0B1020]"
                  >
                    Send reply
                  </button>
                </form>
              </section>
            );
          })}
          {!memberIds.length && (
            <p className="text-sm text-[#9AA3B5]">No messages yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}