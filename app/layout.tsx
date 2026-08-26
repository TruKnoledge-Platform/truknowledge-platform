import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

async function siteIcon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "/favicon.ico";
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("platform_settings")
    .select("site_icon_url")
    .eq("id", 1)
    .maybeSingle();
  return data?.site_icon_url || "/favicon.ico";
}

export async function generateMetadata(): Promise<Metadata> {
  const icon = await siteIcon();
  return {
    title: "TruKnowledge",
    description: "Connecting real hearts, minds and souls. Courses and Web Apps.",
    appleWebApp: {
      capable: true,
      title: "TruKnowledge",
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon,
      apple: icon,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}