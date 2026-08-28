import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let iconUrl = "";

  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("platform_settings")
      .select("site_icon_url")
      .eq("id", 1)
      .maybeSingle();
    iconUrl = data?.site_icon_url || "";
  }

  if (iconUrl) {
    const res = await fetch(iconUrl, { cache: "no-store" });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = res.headers.get("content-type") || "image/png";
      const src = `data:${mime};base64,${buf.toString("base64")}`;
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              background: "#0B1020",
            }}
          >
            <img
              src={src}
              width={180}
              height={180}
              style={{ objectFit: "cover" }}
            />
          </div>
        ),
        { ...size }
      );
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
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        T
      </div>
    ),
    { ...size }
  );
}