import { createFileRoute } from "@tanstack/react-router";
import { Box } from "lucide-react";

import { LoginForm } from "./-components/form";

export const Route = createFileRoute("/_auth/login/")({
  component: Login,
});

function Login() {
  return (
    <div className="min-h-svh flex">
      {/* Left decorative panel — deep warm dark inspired by toko */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "oklch(0.108 0.030 38)" }}
      >
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.918 0.010 58 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.918 0.010 58 / 0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Orange glow blob bottom-left */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "oklch(0.625 0.228 35)", opacity: 0.18 }}
        />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="size-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.625 0.228 35)" }}
          >
            <Box className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "oklch(0.918 0.010 58)" }}>
            Bunstack.
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{
              background: "oklch(0.625 0.228 35 / 0.18)",
              color: "oklch(0.625 0.228 35)",
            }}
          >
            <span className="size-1.5 rounded-full bg-current inline-block" />
            Developer platform
          </div>
          <h2
            className="text-[2.6rem] font-extrabold leading-[1.1]"
            style={{ color: "oklch(0.918 0.010 58)" }}
          >
            Build at the<br />
            speed of<br />
            thought.
          </h2>
          <p
            className="text-base leading-relaxed max-w-xs"
            style={{ color: "oklch(0.580 0.018 55)" }}
          >
            A modern full-stack monorepo template. Fast, typed end-to-end, and ready to ship.
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
          <span className="font-bold text-lg">Bunstack.</span>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
