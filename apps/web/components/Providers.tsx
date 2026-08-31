"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

type Locale = "en" | "zh";
type Messages = typeof en;
const LanguageContext = createContext<{ locale: Locale; messages: Messages; toggle: () => void }>({ locale: "en", messages: en, toggle: () => undefined });

export function useLanguage() { return useContext(LanguageContext); }

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } }));
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo(() => ({ locale, messages: locale === "en" ? en : zh, toggle: () => setLocale((current) => current === "en" ? "zh" : "en") }), [locale]);
  return <QueryClientProvider client={queryClient}><LanguageContext.Provider value={value}>{children}</LanguageContext.Provider></QueryClientProvider>;
}
