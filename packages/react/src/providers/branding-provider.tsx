import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect } from "react";

import { configsQueryOptions } from "~react/queries/configs";

type BrandingConfig = {
  appName: string;
  appCaption: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  loginHeroTitle: string | null;
  loginHeroSubtitle: string | null;
};

const defaults: BrandingConfig = {
  appName: "Bunstack.",
  appCaption: null,
  logoUrl: null,
  faviconUrl: null,
  primaryColor: null,
  loginHeroTitle: null,
  loginHeroSubtitle: null,
};

export const BrandingContext = createContext<BrandingConfig>(defaults);

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery(configsQueryOptions);

  const branding: BrandingConfig = { ...defaults };

  if (data?.configs) {
    for (const config of data.configs) {
      if (!config.configKey.startsWith("branding.")) continue;
      const field = config.configKey.slice("branding.".length) as keyof BrandingConfig;
      if (field in defaults) {
        (branding as Record<string, string | null>)[field] = config.value ?? null;
      }
    }
    if (!branding.appName) branding.appName = defaults.appName;
  }

  useEffect(() => {
    if (branding.primaryColor) {
      document.documentElement.style.setProperty("--primary", branding.primaryColor);
      document.documentElement.style.setProperty("--ring", branding.primaryColor);
      document.documentElement.style.setProperty("--sidebar-primary", branding.primaryColor);
      document.documentElement.style.setProperty("--sidebar-ring", branding.primaryColor);
    }
  }, [branding.primaryColor]);

  useEffect(() => {
    if (branding.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding.faviconUrl]);

  useEffect(() => {
    document.title = branding.appName;
  }, [branding.appName]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}
