import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let name = "TruKnowledge";
  let icon = "/favicon.ico";

  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("courses")
      .select("title, icon_url, thumbnail_url, is_published")
      .eq("id", courseId)
      .maybeSingle();

    if (data?.title) name = data.title;
    icon = data?.icon_url || data?.thumbnail_url || "/favicon.ico";
  }

  const manifest = {
    name,
    short_name: name.slice(0, 12),
    description: "TruKnowledge Web App",
    start_url: `/webapp/${courseId}`,
    scope: "/",
    display: "standalone",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    id: `/webapp/${courseId}`,
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

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300",
    },
  });
}