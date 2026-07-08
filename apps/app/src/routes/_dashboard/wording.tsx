import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/http";
import { authorizeBatchQueryOptions } from "@/queries/auth";
import { Button } from "~orbit/components/ui/Button";
import { Input } from "~orbit/components/ui/Input";

const LOCALES = ["en", "fr"] as const;

const overridableKeysQueryOptions = {
  queryKey: ["organization", "translations", "keys"] as const,
  queryFn: async () => {
    const res = await api.organization.translations.$get();
    if (!res.ok) throw await ApiError.fromResponse(res);
    return (await res.json()).keys;
  },
};

function overridesQueryOptions(locale: string) {
  return {
    queryKey: ["organization", "translations", locale] as const,
    queryFn: async () => {
      const res = await api.organization.translations[":locale"].$get({ param: { locale } });
      if (!res.ok) throw await ApiError.fromResponse(res);
      return (await res.json()).overrides as Record<string, Record<string, string>>;
    },
  };
}

export const Route = createFileRoute("/_dashboard/wording")({
  component: WordingSettings,
  beforeLoad: async ({ context }) => {
    const [allowed] = await context.queryClient.ensureQueryData(
      authorizeBatchQueryOptions([{ permission: "translation:update" }]),
    );
    if (!allowed) throw redirect({ to: "/" });
  },
  staticData: { crumb: "settings.title" },
});

function WordingSettings() {
  const { i18n } = useTranslation("web");
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<string>(i18n.resolvedLanguage ?? "en");

  const { data: keys } = useQuery(overridableKeysQueryOptions);
  const { data: overrides } = useQuery(overridesQueryOptions(locale));

  const save = useMutation({
    mutationFn: async ({ namespace, key, value }: { namespace: string; key: string; value: string | null }) => {
      const res = await api.organization.translations.$put({ json: { locale, namespace, key, value } });
      if (!res.ok) throw await ApiError.fromResponse(res);
    },
    onSuccess: (_data, { namespace, key, value }) => {
      queryClient.invalidateQueries({ queryKey: ["organization", "translations", locale] });
      if (value === null) {
        // Reset: reload to restore the bundled default (removeResourceBundle
        // would drop the whole namespace, not one key)
        window.location.reload();
        return;
      }
      i18n.addResourceBundle(locale, namespace, unflatten({ [key]: value }), true, true);
      toast.success("Wording updated");
    },
    meta: { errorMessage: "Failed to update wording" },
  });

  return (
    <div className="flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Wording</h1>
        <div className="flex gap-1">
          {LOCALES.map(code => (
            <Button
              key={code}
              variant={locale === code ? "default" : "ghost"}
              onClick={() => setLocale(code)}
            >
              {code.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-black/60">
        Override the product wording for your organization. Empty overrides fall back to the default.
      </p>

      <div className="flex flex-col gap-3">
        {keys?.map(entry => (
          <WordingRow
            key={`${entry.namespace}.${entry.key}`}
            namespace={entry.namespace}
            i18nKey={entry.key}
            description={entry.description}
            locale={locale}
            override={overrides?.[entry.namespace]?.[entry.key]}
            onSave={value => save.mutate({ namespace: entry.namespace, key: entry.key, value })}
          />
        ))}
      </div>
    </div>
  );
}

type WordingRowProps = {
  namespace: string;
  i18nKey: string;
  description: string;
  locale: string;
  override: string | undefined;
  onSave: (value: string | null) => void;
};

function WordingRow({ namespace, i18nKey, description, locale, override, onSave }: WordingRowProps) {
  const { i18n } = useTranslation();
  const bundledDefault = i18n.getResource(locale, namespace, i18nKey) as string | undefined;
  const [draft, setDraft] = useState<string | null>(null);

  const current = draft ?? override ?? "";

  return (
    <div className="flex flex-col gap-1 rounded border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{description}</span>
        <span className="font-mono text-xs text-black/40">
          {namespace}
          :
          {i18nKey}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder={bundledDefault ?? ""}
          value={current}
          onChange={e => setDraft(e.target.value)}
        />
        <Button
          variant="outline"
          disabled={draft === null || draft === ""}
          onClick={() => {
            onSave(draft);
            setDraft(null);
          }}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          disabled={!override}
          onClick={() => {
            onSave(null);
            setDraft(null);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function unflatten(entries: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(entries)) {
    const parts = path.split(".");
    let node = result;
    for (const part of parts.slice(0, -1)) {
      node = (node[part] ??= {}) as Record<string, unknown>;
    }
    node[parts[parts.length - 1]!] = value;
  }
  return result;
}
