import sharp from "sharp";

function packIco(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + 16 * pngs.length;
  const entries: Buffer[] = [];
  const bodies: Buffer[] = [];

  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size;
    entry[1] = size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
    bodies.push(data);
  }

  return Buffer.concat([header, ...entries, ...bodies]);
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return new Response(null, { status: 404 });

  const res = await fetch(
    `${base}/storage/v1/object/public/course-files/thumbnails/site/current.png`,
    { cache: "no-store" }
  );
  if (!res.ok) return new Response(null, { status: 404 });

  const src = Buffer.from(await res.arrayBuffer());
  const pngs = [];
  for (const size of [16, 32, 48]) {
    const data = await sharp(src)
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();
    pngs.push({ size, data });
  }

  return new Response(packIco(pngs), {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=3600",
    },
  });
}