"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ListingCheckboxes({ courseId }: { courseId: string }) {
  const supabase = createClient();
  const [site, setSite] = useState(true);
  const [platform, setPlatform] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("courses")
        .select("show_on_site, show_on_platform")
        .eq("id", courseId)
        .single();
      if (!data) return;
      setSite(data.show_on_site !== false);
      setPlatform(data.show_on_platform !== false);
    }
    load();
  }, [courseId]);

  async function save(nextSite: boolean, nextPlatform: boolean) {
    setSite(nextSite);
    setPlatform(nextPlatform);
    setSaving(true);
    await supabase
      .from("courses")
      .update({
        show_on_site: nextSite,
        show_on_platform: nextPlatform,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);
    setSaving(false);
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-5">
      <p className="text-sm font-medium">Where this course is listed</p>
      <p className="mt-1 text-xs text-slate-400">
        Only used after the course is published. Direct links and enrolled
        learners still work.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={site}
          onChange={(e) => save(e.target.checked, platform)}
        />
        Show on my site
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={platform}
          onChange={(e) => save(site, e.target.checked)}
        />
        Show on TruKnowledge
      </label>
      {saving && <p className="mt-2 text-xs text-orange-400">Saving…</p>}
    </div>
  );
}