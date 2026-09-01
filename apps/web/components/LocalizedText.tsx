"use client";

import { useLanguage } from "./Providers";

export type LocalizedCopy = { en: string; zh: string };

export function LocalizedText({ en, zh }: LocalizedCopy) {
  const { locale } = useLanguage();
  return <>{locale === "zh" ? zh : en}</>;
}
