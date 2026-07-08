import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { flagsQueryOptions, setFlag } from "@/queries/flags";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import { Badge } from "~orbit/components/ui/Badge";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";
import { Switch } from "~orbit/components/ui/Toggle";

export const Route = createFileRoute("/_dashboard/flags")({
  component: FlagsPage,
});

function FlagsPage() {
  const queryClient = useQueryClient();
  const { data: flags } = useQuery(flagsQueryOptions);

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: Parameters<typeof setFlag>[0]; enabled: boolean }) => setFlag(key, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flagsQueryOptions.queryKey });
      toast.success("Feature flag mis à jour");
    },
    meta: { errorMessage: "Impossible de mettre à jour le flag" },
  });

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Feature flags</PageHeaderTitle>
            <PageHeaderDescription>
              Valeurs plateforme (défaut pour toutes les organisations). Les flags de portée « organisation »
              peuvent aussi être surchargés org par org depuis leur fiche.
            </PageHeaderDescription>
          </PageHeaderHeading>
        </PageHeader>

        <Panel>
          <PanelHeader label="Registre" />
          <PanelBody className="p-0">
            <ul className="divide-y divide-line">
              {flags?.map(flag => (
                <li key={flag.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium text-ink">{flag.key}</span>
                      <Badge tone={flag.scope === "platform" ? "ink" : "sky"}>
                        {flag.scope === "platform" ? "plateforme" : "organisation"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted">{flag.description}</div>
                  </div>
                  <span className="shrink-0 text-xs text-faint">
                    défaut :
                    {" "}
                    {flag.defaultEnabled ? "activé" : "désactivé"}
                  </span>
                  <Switch
                    checked={flag.enabled}
                    onChange={() => toggle.mutate({ key: flag.key, enabled: !flag.enabled })}
                    disabled={toggle.isPending}
                  />
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </Stack>
    </Container>
  );
}
