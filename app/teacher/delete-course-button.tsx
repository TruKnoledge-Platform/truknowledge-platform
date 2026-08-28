"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function DeleteCourseButton({
  courseId,
  afterDelete = "/teacher",
}: {
  courseId: string;
  afterDelete?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    const ok = window.confirm(
      "Delete this course, its sessions, materials, and enrollments? This cannot be undone."
    );
    if (!ok) return;

    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.push(afterDelete);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
    >
      Delete
    </button>
  );
}