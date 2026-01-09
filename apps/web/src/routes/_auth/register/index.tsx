import { createFileRoute, redirect } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { useTranslation } from "react-i18next";

import { RegisterForm } from "./-components/form";

export const Route = createFileRoute("/_auth/register/")({
  component: Register,
  beforeLoad: ({ context }) => {
    if (context.disableRegister) {
      return redirect({ to: "/login", replace: true });
    }
  },
});

function Register() {
  const { t } = useTranslation("common");

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Box className="size-4" />
          </div>
          {t("core.name")}
        </a>
        <RegisterForm />
      </div>
    </div>
  );
}
