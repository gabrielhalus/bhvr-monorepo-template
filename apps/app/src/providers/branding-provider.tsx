import { useQuery } from "@tanstack/react-query";
import { createContext, use, useEffect } from "react";
import { ENV } from "varlock/env";

import { configsQueryOptions } from "@/queries/configs";

type BrandingConfig = {
  appName: string;
  appCaption: string | null;
  /** Resolved public URL for the logo, or null if not set. */
  logoUrl: string | null;
  /** Resolved public URL for the favicon, or null if not set. */
  faviconUrl: string | null;
  primaryColor: string | null;
  loginHeroTitle: string | null;
  loginHeroSubtitle: string | null;
};

function brandingImageUrl(path: string): string {
  return `${String(ENV.VITE_API_URL).replace(/\/$/, "")}${path}`;
}

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
  return use(BrandingContext);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery(configsQueryOptions);

  const branding: BrandingConfig = { ...defaults };

  if (data?.configs) {
    for (const config of data.configs) {
      if (!config.configKey.startsWith("branding.")) continue;
      const subKey = config.configKey.slice("branding.".length);

      // logoUrl and faviconUrl now store S3 keys — map to the serve endpoint.
      if (subKey === "logoUrl") {
        branding.logoUrl = config.value ? brandingImageUrl("/branding/logo") : null;
      } else if (subKey === "faviconUrl") {
        branding.faviconUrl = config.value ? brandingImageUrl("/branding/favicon") : null;
      } else {
        const field = subKey as keyof BrandingConfig;
        if (field in defaults) {
          (branding as Record<string, string | null>)[field] = config.value ?? null;
        }
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
    <BrandingContext value={branding}>
      {children}
    </BrandingContext>
  );
}
