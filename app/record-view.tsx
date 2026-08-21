"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function RecordView({ courseId }: { courseId: string }) {
  useEffect(() => {
    if (!courseId) return;
    const supabase = createClient();
    supabase.from("course_views").insert({ course_id: courseId });
  }, [courseId]);

  return null;
}