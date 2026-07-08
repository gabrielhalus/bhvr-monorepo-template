import type { Config } from "~shared/types/db/configs.types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { configsQueryOptions, rotateConfig, updateConfig } from "@/queries/configs";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { RefreshCw, Save } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";
import { Switch } from "~orbit/components/ui/Toggle";

export const Route = createFileRoute("/_dashboard/configs")({
  component: ConfigsPage,
});

function ConfigsPage() {
  const { data: configs } = useQuery(configsQueryOptions);

  // Group leaf keys under their top-level section (authentication, branding…)
  const sections = new Map<string, Config[]>();
  for (const config of configs ?? []) {
    if (config.type === "node") continue;
    const section = config.configKey.split(".")[0]!;
    sections.set(section, [...(sections.get(section) ?? []), config]);
  }

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Configuration</PageHeaderTitle>
            <PageHeaderDescription>
              Réglages plateforme. Les clés de portée « organisation » (branding…) servent de défaut,
              surchargeable par chaque organisation depuis son propre espace.
            </PageHeaderDescription>
          </PageHeaderHeading>
        </PageHeader>

        {[...sections.entries()].map(([section, entries]) => (
          <Panel key={section}>
            <PanelHeader label={section} />
            <PanelBody className="p-0">
              <ul className="divide-y divide-line">
                {entries.sort((a, b) => a.configKey.localeCompare(b.configKey)).map(config => (
                  <ConfigRow key={config.configKey} config={config} />
                ))}
              </ul>
            </PanelBody>
          </Panel>
        ))}
      </Stack>
    </Container>
  );
}

function ConfigRow({ config }: { config: Config }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (value: string | null) => updateConfig(config.configKey, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configsQueryOptions.queryKey });
      setDraft(null);
      toast.success("Configuration mise à jour");
    },
    meta: { errorMessage: "Impossible de mettre à jour la configuration" },
  });

  const rotate = useMutation({
    mutationFn: () => rotateConfig(config.configKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configsQueryOptions.queryKey });
      toast.success("Secret régénéré");
    },
    meta: { errorMessage: "Impossible de régénérer le secret" },
  });

  const label = (
    <div className="min-w-0 flex-1 leading-tight">
      <div className="flex items-center gap-2">
        <span className="truncate font-mono text-[13px] font-medium text-ink">{config.configKey}</span>
        {config.scope === "organization" && <Badge tone="sky">organisation</Badge>}
        {config.secret && <Badge tone="amber">secret</Badge>}
        {config.isOverridden && <Badge tone="accent">personnalisé</Badge>}
      </div>
    </div>
  );

  if (config.type === "boolean") {
    const checked = (draft ?? config.value) === "true";
    return (
      <li className="flex items-center gap-3 px-4 py-2.5">
        {label}
        <Switch
          checked={checked}
          onChange={() => save.mutate(checked ? "false" : "true")}
          disabled={save.isPending}
        />
      </li>
    );
  }

  if (config.rotatable) {
    return (
      <li className="flex items-center gap-3 px-4 py-2.5">
        {label}
        <span className="text-xs text-faint">••••••••</span>
        <Button variant="outline" size="sm" onClick={() => rotate.mutate()} disabled={rotate.isPending}>
          <RefreshCw className="size-3.5" />
          Régénérer
        </Button>
      </li>
    );
  }

  const current = draft ?? config.value ?? "";
  const dirty = draft !== null && draft !== (config.value ?? "");

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      {label}
      <Input
        className="w-72"
        type={config.secret ? "password" : "text"}
        placeholder={config.secret ? "••••••••" : config.defaultValue ?? "—"}
        value={current}
        onChange={e => setDraft(e.target.value)}
      />
      <Button size="sm" variant="outline" disabled={!dirty || save.isPending} onClick={() => save.mutate(draft === "" ? null : draft)}>
        <Save className="size-3.5" />
        Enregistrer
      </Button>
    </li>
  );
}
