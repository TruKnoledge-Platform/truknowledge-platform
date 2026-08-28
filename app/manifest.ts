import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const icon = base
    ? `${base}/storage/v1/object/public/course-files/thumbnails/site/current.png`
    : "/icon";

  return {
    name: "TruKnowledge",
    short_name: "TruKnowledge",
    description: "People teaching people. Courses and Web Apps.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    icons: [
      { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}