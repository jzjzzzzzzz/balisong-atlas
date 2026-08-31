import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: { default: "Balisong Atlas — An AI-Assisted Visual History of the Butterfly Knife", template: "%s — Balisong Atlas" },
  description: "Explore the cultural, historical, and visual evolution of the balisong through archival evidence, annotated imagery, and transparent AI-assisted reconstruction.",
  openGraph: {
    type: "website", title: "Balisong Atlas — An AI-Assisted Visual History of the Butterfly Knife",
    description: "An evidence-first digital archive for cultural history, annotated imagery, and transparent reconstruction hypotheses.",
  },
  twitter: { card: "summary_large_image", title: "Balisong Atlas", description: "Every reconstruction should reveal its evidence." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
