"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

export type Locale = "en" | "zh";
type Messages = typeof en;
type LanguageValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
};

const LanguageContext = createContext<LanguageValue>({
  locale: "en",
  messages: en,
  setLocale: () => undefined,
  toggle: () => undefined,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function Providers({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } }));
  const [locale, updateLocale] = useState<Locale>(initialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    updateLocale(nextLocale);
    document.cookie = `atlas_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem("atlas_locale", nextLocale);
    document.documentElement.lang = nextLocale === "zh" ? "zh-CN" : "en";
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("atlas_locale");
    if ((stored === "en" || stored === "zh") && stored !== locale) {
      updateLocale(stored);
      document.cookie = `atlas_locale=${stored}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = stored === "zh" ? "zh-CN" : "en";
      return;
    }
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = useMemo<LanguageValue>(() => ({
    locale,
    messages: locale === "en" ? en : zh,
    setLocale,
    toggle: () => setLocale(locale === "en" ? "zh" : "en"),
  }), [locale, setLocale]);

  return <QueryClientProvider client={queryClient}><LanguageContext.Provider value={value}>{children}</LanguageContext.Provider></QueryClientProvider>;
}
