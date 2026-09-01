import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Providers, type Locale } from "@/components/Providers";
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const savedLocale = (await cookies()).get("atlas_locale")?.value;
  const initialLocale: Locale = savedLocale === "zh" ? "zh" : "en";
  return <html lang={initialLocale === "zh" ? "zh-CN" : "en"} suppressHydrationWarning><body><Providers initialLocale={initialLocale}>{children}</Providers></body></html>;
}
