import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { createOrganization, organizationsQueryOptions } from "@/queries/organizations";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~orbit/components/ui/Dialog";
import { EmptyState } from "~orbit/components/ui/EmptyState";
import { Building2, ChevronRight, Plus } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";

export const Route = createFileRoute("/_dashboard/organizations/")({
  component: Organizations,
});

function Organizations() {
  const { data: organizations } = useQuery(organizationsQueryOptions);

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Organisations</PageHeaderTitle>
            <PageHeaderDescription>
              Chaque organisation est un espace isolé, résolu par son sous-domaine ou un domaine personnalisé.
            </PageHeaderDescription>
          </PageHeaderHeading>
          <PageHeaderActions>
            <CreateOrganizationDialog />
          </PageHeaderActions>
        </PageHeader>

        <Panel>
          <PanelHeader label={`${organizations?.length ?? 0} organisation(s)`} />
          <PanelBody className="p-0">
            {organizations?.length === 0 && (
              <EmptyState
                icon={Building2}
                title="Aucune organisation"
                description="Créez la première organisation pour démarrer."
              />
            )}
            <ul className="divide-y divide-line">
              {organizations?.map(org => (
                <li key={org.id}>
                  <Link
                    to="/organizations/$orgId"
                    params={{ orgId: org.id }}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-[#5a3ee0]">
                      <Building2 className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-sm font-semibold text-ink">{org.name}</div>
                      <div className="truncate text-xs text-faint">
                        Créée le
                        {" "}
                        {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <Badge tone="neutral" className="font-mono">{org.slug}</Badge>
                    <ChevronRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </Stack>
    </Container>
  );
}

function CreateOrganizationDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const create = useMutation({
    mutationFn: () => createOrganization({ name, slug }),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: organizationsQueryOptions.queryKey });
      setName("");
      setSlug("");
      setOpen(false);
      toast.success(`Organisation « ${org.name} » créée`);
    },
    meta: { errorMessage: "Impossible de créer l'organisation" },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nouvelle organisation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle organisation</DialogTitle>
          <DialogDescription>
            Le sous-domaine, les rôles (owner/admin/member) et les réglages par défaut sont provisionnés automatiquement.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-org"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Nom" htmlFor="org-name">
            <Input id="org-name" value={name} onChange={e => setName(e.target.value)} required />
          </Field>
          <Field label="Slug (sous-domaine)" htmlFor="org-slug" hint="Minuscules, chiffres et tirets — ex. acme">
            <Input
              id="org-slug"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase())}
              pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
              required
            />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button type="submit" form="create-org" disabled={create.isPending}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
