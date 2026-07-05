import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useBranding } from "@/providers/branding-provider";
import { Sparkle } from "~orbit/components/ui/Sparkle";

import { ForgotPasswordForm } from "./-components/form";

export const Route = createFileRoute("/_auth/forgot-password/")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const branding = useBranding();
  const { t } = useTranslation("auth");

  return (
    <div className="flex min-h-svh bg-paper">
      {/* Left decorative panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex lg:w-[45%]">
        <div className="workspace-grid-ink pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/25 blur-3xl" />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-9 place-items-center overflow-hidden rounded-xl bg-accent text-white shadow-accent">
            {branding.logoUrl
              ? <img src={branding.logoUrl} className="size-9 object-cover" alt={branding.appName} />
              : <Sparkle className="size-5" />}
          </div>
          <span className="text-xl font-bold text-white">{branding.appName}</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-white/70">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_12px_rgba(108,74,242,0.9)]" />
            {branding.appName}
          </div>
          <h2 className="text-sheen text-[2.6rem] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {t("forgotPassword.heroTitle")}
          </h2>
          <p className="max-w-xs text-base/relaxed text-white/55">
            {t("forgotPassword.heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="grid size-7 place-items-center overflow-hidden rounded-lg bg-accent text-white">
            {branding.logoUrl
              ? <img src={branding.logoUrl} className="size-7 object-cover" alt={branding.appName} />
              : <Sparkle className="size-4" />}
          </div>
          <span className="text-lg font-bold text-ink">{branding.appName}</span>
        </div>

        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
