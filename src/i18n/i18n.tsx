import React from "react";
import { translations, type Locale } from "@/i18n/translations";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider = ({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) => {
  const [locale, setLocale] = React.useState<Locale>(initialLocale);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string, variables?: Record<string, string | number>) => {
        const base = translations[locale][key] ?? translations.en[key] ?? key;
        if (!variables) return base;
        return Object.entries(variables).reduce(
          (value, [varKey, varValue]) =>
            value.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(varValue)),
          base
        );
      },
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
};
