import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Five Tape",
  description: "Live prices and volumes for Bitcoin, Ethereum, XRP, Cardano, and Cronos.",
  robots: { index: false, follow: false },
};

export default function TapeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
