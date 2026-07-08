import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { logsQueryOptions } from "@/queries/logs";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";

export const Route = createFileRoute("/_dashboard/logs")({
  component: LogsPage,
});

function toneForAction(action: string): "coral" | "amber" | "neutral" {
  if (action.includes("denied") || action.includes("error") || action.includes("failed")) return "coral";
  if (action.includes("delete") || action.includes("revoke")) return "amber";
  return "neutral";
}

function LogsPage() {
  const [page, setPage] = useState(1);
  const { data } = useQuery(logsQueryOptions(page));

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Journal d'audit</PageHeaderTitle>
            <PageHeaderDescription>
              Tous les événements, toutes organisations confondues (« plateforme » = hors organisation).
            </PageHeaderDescription>
          </PageHeaderHeading>
        </PageHeader>

        <Panel>
          <PanelHeader label={`${data?.total ?? 0} événement(s)`} />
          <PanelBody className="p-0">
            {data?.data.length === 0 && <p className="p-4 text-sm text-muted">Aucun événement.</p>}
            <ul className="divide-y divide-line">
              {data?.data.map(log => (
                <li key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Badge tone={toneForAction(log.action)} className="w-44 shrink-0 justify-center font-mono">
                    {log.action}
                  </Badge>
                  <Badge tone={log.organizationId ? "sky" : "ink"} className="shrink-0">
                    {log.organizationId ? "org" : "plateforme"}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-muted">
                    {log.targetType ? `${log.targetType} · ` : ""}
                    {log.targetId ?? log.actorId}
                  </span>
                  <span className="shrink-0 text-xs text-faint">{new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Précédent
            </Button>
            <span className="text-sm text-muted">
              Page
              {" "}
              {page}
              {" "}
              /
              {" "}
              {data?.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>
              Suivant
            </Button>
          </div>
        )}
      </Stack>
    </Container>
  );
}
