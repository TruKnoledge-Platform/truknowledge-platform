import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let icon = "/icon";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("platform_settings")
      .select("site_icon_url")
      .eq("id", 1)
      .maybeSingle();
    if (data?.site_icon_url) icon = data.site_icon_url;
  }

  return {
    name: "TruKnowledge",
    short_name: "TruKnowledge",
    description: "People teaching people. Courses and Web Apps.",
    start_url: "/learn",
    display: "standalone",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    icons: [
      {
        src: icon,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}