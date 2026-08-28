import { ImageResponse } from "next/og";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const iconUrl = base
    ? `${base}/storage/v1/object/public/course-files/thumbnails/site/current.png`
    : "";

  if (iconUrl) {
    const res = await fetch(iconUrl, { cache: "no-store" });
    if (res.ok) {
      const png = await sharp(Buffer.from(await res.arrayBuffer()))
        .resize(32, 32, { fit: "cover" })
        .png()
        .toBuffer();
      return new Response(png, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1020",
          color: "#E8A24A",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        T
      </div>
    ),
    { ...size }
  );
}