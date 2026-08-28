import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "TruKnowledge",
  description: "Connecting real hearts, minds and souls. Courses and Web Apps.",
  applicationName: "TruKnowledge",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TruKnowledge",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png" },
      { url: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: "/pwa-icon/192",
  },
};

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