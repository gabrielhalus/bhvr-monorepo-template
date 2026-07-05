import type { BrandingConfig } from "@/hooks/use-branding";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ENV } from "varlock/env";

import { BrandingContext, brandingDefaults } from "@/hooks/use-branding";
import { configsQueryOptions } from "@/queries/configs";

function brandingImageUrl(path: string): string {
  return `${String(ENV.VITE_API_URL).replace(/\/$/, "")}${path}`;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery(configsQueryOptions);

  const branding = useMemo(() => {
    const next: BrandingConfig = { ...brandingDefaults };

    if (data?.configs) {
      for (const config of data.configs) {
        if (!config.configKey.startsWith("branding.")) continue;
        const subKey = config.configKey.slice("branding.".length);

        // logoUrl and faviconUrl now store S3 keys — map to the serve endpoint.
        if (subKey === "logoUrl") {
          next.logoUrl = config.value ? brandingImageUrl("/branding/logo") : null;
        } else if (subKey === "faviconUrl") {
          next.faviconUrl = config.value ? brandingImageUrl("/branding/favicon") : null;
        } else {
          const field = subKey as keyof BrandingConfig;
          if (field in brandingDefaults) {
            (next as Record<string, string | null>)[field] = config.value ?? null;
          }
        }
      }
      if (!next.appName) next.appName = brandingDefaults.appName;
    }

    return next;
  }, [data]);

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
