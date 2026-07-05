import { createContext, use } from "react";

export type BrandingConfig = {
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

export const brandingDefaults: BrandingConfig = {
  appName: "Bunstack.",
  appCaption: null,
  logoUrl: null,
  faviconUrl: null,
  primaryColor: null,
  loginHeroTitle: null,
  loginHeroSubtitle: null,
};

export const BrandingContext = createContext<BrandingConfig>(brandingDefaults);

export function useBranding() {
  return use(BrandingContext);
}
