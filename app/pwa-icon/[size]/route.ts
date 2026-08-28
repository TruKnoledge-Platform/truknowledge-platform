import sharp from "sharp";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["192", "512", "maskable"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  if (!ALLOWED.has(size)) return new Response(null, { status: 404 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return new Response(null, { status: 404 });

  const res = await fetch(
    `${base}/storage/v1/object/public/course-files/thumbnails/site/current.png`,
    { cache: "no-store" }
  );
  if (!res.ok) return new Response(null, { status: 404 });

  const src = Buffer.from(await res.arrayBuffer());
  const px = size === "192" ? 192 : 512;

  let png: Buffer;
  if (size === "maskable") {
    const inner = Math.round(px * 0.8);
    const pad = Math.round((px - inner) / 2);
    png = await sharp(src)
      .resize(inner, inner, { fit: "cover" })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 11, g: 16, b: 32, alpha: 1 },
      })
      .png()
      .toBuffer();
  } else {
    png = await sharp(src).resize(px, px, { fit: "cover" }).png().toBuffer();
  }

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}