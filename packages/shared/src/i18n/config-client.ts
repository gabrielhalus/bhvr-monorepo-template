import type { i18n, InitOptions as I18NextInitOptions } from "i18next";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./en";
import fr from "./fr";

type ArbitraryNamespace = string & { __brand?: "ArbitraryNamespace" };
type Namespace = keyof typeof en | ArbitraryNamespace;
type NsOption = Namespace | Namespace[];

const bundledResources = { en, fr };

export type InitOptions = { ns?: NsOption } & Omit<I18NextInitOptions, "ns">;

export function createClientI18n(extra: Partial<InitOptions> = {}): i18n {
  const instance = i18next.createInstance()
    .use(LanguageDetector)
    .use(initReactI18next);

  instance.init({
    fallbackLng: "en",
    defaultNS: "common",
    ns: Object.keys(en) as string[],
    supportedLngs: ["en", "fr"],
    resources: bundledResources,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    ...extra,
  } as I18NextInitOptions);

  return instance;
}
