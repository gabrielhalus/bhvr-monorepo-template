import type { OrgFlag } from "@/queries/organizations";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { setFlag } from "@/queries/flags";
import { deleteOrganization, organizationQueryOptions, organizationsQueryOptions, updateOrganization } from "@/queries/organizations";
import { Container } from "~orbit/components/layout/Container";
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderEyebrow, PageHeaderHeading, PageHeaderTitle } from "~orbit/components/layout/PageHeader";
import { Stack } from "~orbit/components/layout/Stack";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~orbit/components/ui/AlertDialog";
import { Avatar } from "~orbit/components/ui/Avatar";
import { Badge } from "~orbit/components/ui/Badge";
import { Button } from "~orbit/components/ui/Button";
import { Globe, Save, Trash2 } from "~orbit/components/ui/icons";
import { Field, Input } from "~orbit/components/ui/Input";
import { Panel, PanelBody, PanelHeader } from "~orbit/components/ui/Panel";
import { Switch } from "~orbit/components/ui/Toggle";

export const Route = createFileRoute("/_dashboard/organizations/$orgId")({
  component: OrganizationDetail,
});

function OrganizationDetail() {
  const { orgId } = Route.useParams();
  const { data } = useQuery(organizationQueryOptions(orgId));

  if (!data) return null;

  const { organization, domains, members, memberCount, flags } = data;

  return (
    <Container size="lg" className="py-8">
      <Stack gap="lg">
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderEyebrow>Organisation</PageHeaderEyebrow>
            <PageHeaderTitle>{organization.name}</PageHeaderTitle>
            <PageHeaderDescription>
              {memberCount}
              {" "}
              membre(s) ·
              {" "}
              {domains.length}
              {" "}
              domaine(s)
            </PageHeaderDescription>
          </PageHeaderHeading>
          <PageHeaderActions>
            <DeleteOrganizationButton orgId={orgId} name={organization.name} />
          </PageHeaderActions>
        </PageHeader>

        <SettingsPanel orgId={orgId} name={organization.name} slug={organization.slug} />

        <Panel>
          <PanelHeader label="Domaines" icon={<Globe className="size-4" />} />
          <PanelBody className="p-0">
            <ul className="divide-y divide-line">
              {domains.map(domain => (
                <li key={domain.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{domain.domain}</span>
                  <Badge tone="neutral">{domain.type === "subdomain" ? "sous-domaine" : "personnalisé"}</Badge>
                  {domain.isPrimary && <Badge tone="accent">principal</Badge>}
                  <Badge tone={domain.verifiedAt ? "sage" : "amber"} dot>
                    {domain.verifiedAt ? "vérifié" : "en attente"}
                  </Badge>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <FlagsPanel orgId={orgId} flags={flags} />

        <Panel>
          <PanelHeader label={`Membres (${memberCount})`} />
          <PanelBody className="p-0">
            {members.length === 0 && <p className="p-4 text-sm text-muted">Aucun membre.</p>}
            <ul className="divide-y divide-line">
              {members.map(member => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium capitalize text-ink">
                      {member.firstName}
                      {" "}
                      {member.lastName}
                    </div>
                    <div className="truncate text-xs text-faint">{member.email}</div>
                  </div>
                  <span className="shrink-0 text-xs text-faint">
                    {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </Stack>
    </Container>
  );
}

function SettingsPanel({ orgId, name: initialName, slug: initialSlug }: { orgId: string; name: string; slug: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);

  const save = useMutation({
    mutationFn: () => updateOrganization(orgId, { name, slug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      toast.success("Organisation mise à jour");
    },
    meta: { errorMessage: "Impossible de mettre à jour l'organisation" },
  });

  const dirty = name !== initialName || slug !== initialSlug;

  return (
    <Panel>
      <PanelHeader label="Informations" />
      <PanelBody>
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Nom" htmlFor="edit-name" className="min-w-56 flex-1">
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required />
          </Field>
          <Field label="Slug" htmlFor="edit-slug" hint="Changer le slug déplace le sous-domaine" className="min-w-56 flex-1">
            <Input
              id="edit-slug"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase())}
              pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
              required
            />
          </Field>
          <Button type="submit" disabled={!dirty || save.isPending}>
            <Save className="size-4" />
            Enregistrer
          </Button>
        </form>
      </PanelBody>
    </Panel>
  );
}

function FlagsPanel({ orgId, flags }: { orgId: string; flags: OrgFlag[] }) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: OrgFlag["key"]; enabled: boolean }) => setFlag(key, enabled, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations", orgId] });
      toast.success("Feature flag mis à jour");
    },
    meta: { errorMessage: "Impossible de mettre à jour le flag" },
  });

  return (
    <Panel>
      <PanelHeader label="Feature flags" />
      <PanelBody className="p-0">
        <ul className="divide-y divide-line">
          {flags.map(flag => (
            <li key={flag.key} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1 leading-tight">
                <div className="font-mono text-[13px] font-medium text-ink">{flag.key}</div>
                <div className="truncate text-xs text-muted">{flag.description}</div>
              </div>
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
  );
}

function DeleteOrganizationButton({ orgId, name }: { orgId: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsQueryOptions.queryKey });
      toast.success("Organisation supprimée");
      navigate({ to: "/organizations" });
    },
    meta: { errorMessage: "Impossible de supprimer l'organisation" },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger">
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Supprimer «
            {" "}
            {name}
            {" "}
            » ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Les rôles, domaines, invitations et réglages de l'organisation seront supprimés. Les comptes utilisateurs sont conservés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
