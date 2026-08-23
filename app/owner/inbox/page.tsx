import { requireOwner } from "@/lib/is-owner";

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

  const latestByMember = new Map<string, (typeof notes)[0]>();
  for (const note of notes || []) {
    const mid = note.member_id || note.sender_id;
    if (mid && !latestByMember.has(mid)) latestByMember.set(mid, note);
  }

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
        <div className="mt-8 space-y-3">
          {[...latestByMember.entries()].map(([memberId, note]) => (
            <a
              key={memberId}
              href={`/owner/inbox/${memberId}`}
              className="block rounded-xl border border-white/10 bg-[#12182A] p-4 hover:border-[#E8A24A]"
            >
              <p className="text-[#E8A24A]">{emailOf(memberId)}</p>
              <p className="mt-1 text-xs text-[#9AA3B5]">
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="mt-2 line-clamp-2 text-sm">{note.body}</p>
            </a>
          ))}
          {!latestByMember.size && (
            <p className="text-sm text-[#9AA3B5]">No messages yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}