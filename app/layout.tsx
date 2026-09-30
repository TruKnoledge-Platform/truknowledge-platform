import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, Libre_Baskerville, Literata, Nunito, Outfit } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const classic = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-classic",
});

const book = Literata({
  subsets: ["latin"],
  variable: "--font-book",
});

const modern = Outfit({
  subsets: ["latin"],
  variable: "--font-modern",
});

const human = Nunito({
  subsets: ["latin"],
  variable: "--font-human",
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
      <body
        className={`${figtree.variable} ${fraunces.variable} ${classic.variable} ${book.variable} ${modern.variable} ${human.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
