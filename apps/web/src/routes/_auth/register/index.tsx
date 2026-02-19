import { createFileRoute, redirect } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { useTranslation } from "react-i18next";

import { runtimeConfigQueryOptions } from "@/api/runtime-configs/runtime-configs.queries";
import { inferConfigValue } from "~shared/helpers/infer-config-value";

import { RegisterForm } from "./-components/form";

export const Route = createFileRoute("/_auth/register/")({
  component: Register,
  beforeLoad: async ({ context }) => {
    const { value: config } = await context.queryClient.ensureQueryData(runtimeConfigQueryOptions("authentication.disableRegister"));
    if (inferConfigValue(config.value!)) {
      throw redirect({ to: "/login", replace: true });
    }
  },
});

function Register() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-svh flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12 bg-panel-auth">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 pointer-events-none auth-grid" />
        {/* Orange glow blob top-right */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-panel-accent opacity-[0.15]" />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center bg-panel-accent">
            <Box className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold text-panel-heading">
            {t("core.name")}.
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-panel-accent/18 text-panel-accent">
            <span className="size-1.5 rounded-full bg-current inline-block" />
            Get started
          </div>
          <h2 className="text-[2.6rem] font-extrabold leading-[1.1] text-panel-heading">
            Your stack,<br />
            your rules.
          </h2>
          <p className="text-base leading-relaxed max-w-xs text-panel-meta">
            Join and start building with a modern full-stack monorepo template, designed for speed.
          </p>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
            <Box className="size-4" />
          </div>
          <span className="font-bold text-lg">{t("core.name")}.</span>
        </div>

        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
