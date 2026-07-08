import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { logsQueryOptions } from "@/queries/logs";
import { organizationsQueryOptions } from "@/queries/organizations";
import { usersQueryOptions } from "@/queries/users";
import { AutoGrid } from "~orbit/components/layout/AutoGrid";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import { Badge } from "~orbit/components/ui/Badge";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";
import { Stat } from "~orbit/components/ui/Stat";

export const Route = createFileRoute("/_dashboard/")({
  component: Overview,
});

function Overview() {
  const { data: organizations } = useQuery(organizationsQueryOptions);
  const { data: users } = useQuery(usersQueryOptions(1, ""));
  const { data: logs } = useQuery(logsQueryOptions(1, { limit: 8 }));

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Vue d'ensemble</PageHeaderTitle>
            <PageHeaderDescription>État de la plateforme en un coup d'œil.</PageHeaderDescription>
          </PageHeaderHeading>
        </PageHeader>

        <AutoGrid min={220} gap="md">
          <Stat label="Organisations" value={String(organizations?.length ?? "—")} />
          <Stat label="Utilisateurs" value={String(users?.total ?? "—")} />
          <Stat label="Événements d'audit" value={String(logs?.total ?? "—")} />
        </AutoGrid>

        <Panel>
          <PanelHeader label="Activité récente" />
          <PanelBody className="p-0">
            {logs?.data.length === 0 && (
              <p className="p-4 text-sm text-muted">Aucun événement pour l'instant.</p>
            )}
            <ul className="divide-y divide-line">
              {logs?.data.map(log => (
                <li key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Badge tone={log.action.includes("denied") || log.action.includes("error") ? "coral" : "neutral"} className="shrink-0">
                    {log.action}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-muted">{log.targetId ?? log.actorId}</span>
                  <span className="shrink-0 text-xs text-faint">{new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <div className="text-sm text-muted">
          Gérer les
          {" "}
          <Link to="/organizations" className="font-medium text-ink underline underline-offset-4">organisations</Link>
          {" "}
          ou consulter le
          {" "}
          <Link to="/logs" className="font-medium text-ink underline underline-offset-4">journal complet</Link>
          .
        </div>
      </Stack>
    </Container>
  );
}
