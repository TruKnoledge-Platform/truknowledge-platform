"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function SavePlace({ courseId }: { courseId: string }) {
  useEffect(() => {
    async function run() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("https://ipwho.is/");
      const place = await res.json();
      if (!place?.success) return;

      await supabase
        .from("enrollments")
        .update({
          country: place.country || null,
          region: place.region || null,
        })
        .eq("user_id", user.id)
        .eq("course_id", courseId);
    }

    run();
  }, [courseId]);

  return null;
}