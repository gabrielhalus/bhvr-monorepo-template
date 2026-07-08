import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { authQueryOptions, login } from "@/queries/auth";
import { Button } from "~orbit/components/ui/Button";
import { Loader2 } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { Sparkle } from "~orbit/components/ui/Sparkle";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const ok = await login(email, password);
    setSubmitting(false);

    if (!ok) {
      setError("Identifiants invalides");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: authQueryOptions.queryKey });
    navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-paper p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-ink text-accent">
            <Sparkle className="size-6" />
          </span>
          <div className="text-center leading-tight">
            <h1 className="text-xl font-bold tracking-tight text-ink">Administration</h1>
            <p className="mt-1 text-sm text-muted">Espace réservé aux administrateurs de la plateforme.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-soft">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              placeholder="admin@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Mot de passe" htmlFor="password">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              invalid={!!error}
            />
            {error && <p className="text-xs text-coral-deep">{error}</p>}
          </Field>
          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting
              ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Connexion…
                  </>
                )
              : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
