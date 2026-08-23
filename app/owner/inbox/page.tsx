import { requireOwner } from "@/lib/is-owner";

export default async function OwnerInbox() {
  const { supabase } = await requireOwner();
  const { data: notes } = await supabase
    .from("owner_contacts")
    .select("id, sender_id, body, created_at")
    .order("created_at", { ascending: false });

  const senderIds = [...new Set((notes || []).map((n) => n.sender_id))];
  const { data: people } =
    senderIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", senderIds)
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
          Contact from unlisted members
        </h1>
        <div className="mt-8 space-y-4">
          {(notes || []).map((note) => (
            <article
              key={note.id}
              className="rounded-xl border border-white/10 bg-[#12182A] p-4"
            >
              <p className="text-sm text-[#E8A24A]">{emailOf(note.sender_id)}</p>
              <p className="mt-1 text-xs text-[#9AA3B5]">
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{note.body}</p>
              <a
                href={`/owner/people/${note.sender_id}`}
                className="mt-3 inline-block text-sm text-[#E8A24A]"
              >
                Open this member
              </a>
            </article>
          ))}
          {!notes?.length && (
            <p className="text-sm text-[#9AA3B5]">No messages yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}