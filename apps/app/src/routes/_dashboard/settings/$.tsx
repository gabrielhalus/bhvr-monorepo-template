import type { Config, ConfigNode } from "~shared/types/db/configs.types";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateConfigMutationOptions } from "@/api/configs/configs.mutations";
import { configsQueryOptions } from "@/api/configs/configs.queries";
import {
  Bell,
  FileText,
  KeyRound,
  Palette,
  Save,
  ScrollText,
  Settings2,
  ShieldCheck,
  ShoppingCart,
} from "~orbit/components/ui/icons";
import { buildConfigTree, findFirstLeafSection, findNodeBySegments } from "~shared/helpers/config-tree";

import { isConfigValueValid, normalizeConfigValue } from "./-components/config-value";
import { NodeForm } from "./-components/node-form";

type IconComponent = React.ComponentType<{ className?: string }>;

const SECTION_ICONS: Record<string, IconComponent> = {
  security: ShieldCheck,
  authentication: KeyRound,
  branding: Palette,
  orders: ShoppingCart,
  notifications: Bell,
  invoices: FileText,
  documents: ScrollText,
};

export const Route = createFileRoute("/_dashboard/settings/$")(
  {
    component: RouteComponent,
    loader: ({ params }) => {
      const { _splat: splat } = params;
      if (splat) {
        const segments = splat.split("/");
        return { crumb: [`settings.config.${segments.join(".")}.label`, `settings.config.${segments.join(".")}.label`] };
      }
    },
  },
);

function RouteComponent() {
  const { _splat: splat } = Route.useParams();
  const { data: { configs } } = useSuspenseQuery(configsQueryOptions);

  const segments = splat?.split("/").filter(Boolean) ?? [];

  const configTree = useMemo(() => {
    if (!configs) {
      return null;
    }
    return buildConfigTree(configs);
  }, [configs]);

  if (!splat && configTree) {
    const firstLeafSection = findFirstLeafSection(configTree);

    if (firstLeafSection) {
      return <Navigate to="/settings/$" params={{ _splat: firstLeafSection }} replace />;
    }
  }

  if (!configTree || !segments?.length) {
    return null;
  }

  const node = findNodeBySegments(configTree, segments);

  if (!node) {
    return null;
  }

  const sectionKey = segments.join(".");

  return <SectionForm key={sectionKey} node={node} sectionKey={sectionKey} allConfigs={configs ?? []} />;
}

function SectionForm({ node, sectionKey, allConfigs }: { node: ConfigNode; sectionKey: string; allConfigs: Config[] }) {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();
  const saveMutation = useMutation(updateConfigMutationOptions(queryClient));
  const [saving, setSaving] = useState(false);

  const sectionLabel = t(`settings.config.${sectionKey}.label` as never);
  const sectionDesc = t(`settings.config.${sectionKey}.description` as never, { defaultValue: "" });
  const topKey = sectionKey.split(".")[0] ?? "";
  const SectionIcon: IconComponent = SECTION_ICONS[topKey] ?? Settings2;

  const fields = useMemo(
    () => Array.from(node.children.values()).filter((child): child is ConfigNode & { config: Config } => Boolean(child.config)),
    [node],
  );
  const overridesCount = fields.filter(f => f.config.isOverridden).length;

  const initialDraft = () => Object.fromEntries(fields.map(f => [f.fullKey, f.config.value])) as Record<string, string | null>;
  const [draft, setDraft] = useState<Record<string, string | null>>(initialDraft);

  // Overlay unsaved draft values so `disabledWhen` conditions react optimistically,
  // without waiting for a save to persist the dependency field.
  const effectiveConfigs = useMemo(
    () => allConfigs.map(c => (c.configKey in draft ? { ...c, value: draft[c.configKey] ?? null } : c)),
    [allConfigs, draft],
  );

  const dirtyKeys = fields
    .filter(f => normalizeConfigValue(f.config, draft[f.fullKey] ?? null) !== f.config.value)
    .map(f => f.fullKey);
  const hasInvalid = dirtyKeys.some((key) => {
    const field = fields.find(f => f.fullKey === key);
    return field ? !isConfigValueValid(field.config, draft[key] ?? null) : false;
  });

  async function handleSave() {
    if (!dirtyKeys.length || hasInvalid || saving) return;
    setSaving(true);
    try {
      await Promise.all(dirtyKeys.map((key) => {
        const field = fields.find(f => f.fullKey === key)!;
        return saveMutation.mutateAsync({ key, value: normalizeConfigValue(field.config, draft[key] ?? null) });
      }));
      toast.success(t("settings.saveBar.saved"));
    } catch {
      toast.error(t("settings.updateError"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(initialDraft());
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
      {/* Section header */}
      <header className="flex items-start justify-between gap-4 border-b border-line bg-surface-2/40 px-6 py-5">
        <div className="flex items-center gap-3.5">
          <span className="grid size-10.5 shrink-0 place-items-center rounded-md bg-accent text-white shadow-soft [&_svg]:size-4.75">
            <SectionIcon />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[21px] font-bold leading-tight tracking-[-0.035em] text-ink">{sectionLabel}</h2>
            {sectionDesc
              ? <p className="mt-1 max-w-xl text-[12.5px] text-muted">{sectionDesc}</p>
              : <code className="mt-1 block font-mono text-[11px] text-muted">{sectionKey}</code>}
          </div>
        </div>
        {overridesCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-amber-soft px-2.5 py-1 text-[11px] font-semibold text-amber-deep">
            <span className="size-1.5 rounded-full bg-amber" />
            {t("settings.overrides", { count: overridesCount })}
          </span>
        )}
      </header>

      {/* Field rows */}
      <div className="flex flex-col divide-y divide-line">
        {fields.map(field => (
          <NodeForm
            key={field.fullKey}
            node={field}
            allConfigs={effectiveConfigs}
            value={draft[field.fullKey] ?? null}
            onChange={value => setDraft(prev => ({ ...prev, [field.fullKey]: value }))}
          />
        ))}
      </div>

      {/* Sticky save bar (inside the card, faithful to settings.html) */}
      {dirtyKeys.length > 0 && (
        <div className="sticky bottom-4 z-10 mx-6 mb-5 mt-4 flex items-center gap-3 rounded-md bg-ink px-4 py-3 text-white shadow-pop">
          <span className="grid size-5.5 shrink-0 place-items-center rounded-md bg-accent/25 text-accent">
            <Save className="size-3" />
          </span>
          <span className="flex-1 text-[13px] tracking-tight">
            <strong className="font-semibold text-accent">{t("settings.saveBar.pending", { count: dirtyKeys.length })}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              {t("settings.saveBar.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || hasInvalid}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all hover:bg-accent-deep disabled:opacity-50"
            >
              <Save className="size-3" />
              {t("settings.saveBar.save")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
