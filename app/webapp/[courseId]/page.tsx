import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let title = "TruKnowledge";
  let icon = "/favicon.ico";

  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("courses")
      .select("title, icon_url, thumbnail_url")
      .eq("id", courseId)
      .maybeSingle();
    if (data?.title) title = data.title;
    icon = data?.icon_url || data?.thumbnail_url || "/favicon.ico";
  }

  return {
    title,
    appleWebApp: {
      capable: true,
      title,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon,
      apple: icon,
    },
  };
}

export default function WebAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}