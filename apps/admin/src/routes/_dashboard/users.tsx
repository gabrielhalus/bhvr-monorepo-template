import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { usersQueryOptions } from "@/queries/users";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import { Avatar } from "~orbit/components/ui/Avatar";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Search } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";

export const Route = createFileRoute("/_dashboard/users")({
  component: UsersPage,
});

function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data } = useQuery(usersQueryOptions(page, search));

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Utilisateurs</PageHeaderTitle>
            <PageHeaderDescription>
              Tous les comptes de la plateforme, toutes organisations confondues.
            </PageHeaderDescription>
          </PageHeaderHeading>
          <PageHeaderActions>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input
                placeholder="Rechercher…"
                className="w-64 pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </PageHeaderActions>
        </PageHeader>

        <Panel>
          <PanelHeader label={`${data?.total ?? 0} compte(s)`} />
          <PanelBody className="p-0">
            {data?.data.length === 0 && <p className="p-4 text-sm text-muted">Aucun résultat.</p>}
            <ul className="divide-y divide-line">
              {data?.data.map(user => (
                <li key={user.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium capitalize text-ink">
                      {user.firstName}
                      {" "}
                      {user.lastName}
                    </div>
                    <div className="truncate text-xs text-faint">{user.email}</div>
                  </div>
                  {!user.verifiedAt && <Badge tone="amber">email non vérifié</Badge>}
                  <span className="shrink-0 text-xs text-faint">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </span>
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
