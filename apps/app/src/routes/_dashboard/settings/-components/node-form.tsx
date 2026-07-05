import type { Config, ConfigNode } from "~shared/types/db/configs.types";

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useRotateConfig } from "@/hooks/configs/use-rotate-config";
import sayno from "@/lib/sayno";
import { Button } from "~orbit/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~orbit/components/ui/Dialog";
import { Check, CheckCircle2, Copy, Lock, RefreshCw } from "~orbit/components/ui/icons";
import { Input, Textarea } from "~orbit/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~orbit/components/ui/Select";
import { Checkbox, Switch } from "~orbit/components/ui/Toggle";
import { cn } from "~orbit/lib/utils";

import { ConfigImageUploader } from "./config-image-uploader";
import { configTypeTag, evaluateDisabledCondition, isConfigValueValid } from "./config-value";

function SecretRevealDialog({ value, onClose }: { value: string; onClose: () => void }) {
  const { t } = useTranslation("web", { keyPrefix: "settings.secretReveal" });
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input readOnly value={value} className="flex-1 font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type NodeFormProps = {
  node: ConfigNode;
  allConfigs: Config[];
  value: string | null;
  onChange: (value: string | null) => void;
};

export function NodeForm({ node, allConfigs, value, onChange }: NodeFormProps) {
  const { t } = useTranslation("web", { keyPrefix: "settings.config" });
  const { t: tRoot } = useTranslation("web");
  const rotateConfig = useRotateConfig();
  const [revealedValue, setRevealedValue] = useState<string | null>(null);

  const { config } = node;
  if (!config) return null;

  const isDisabled = evaluateDisabledCondition(config.disabledWhen, allConfigs);
  const isRotatable = config.rotatable;
  const isInvalid = !isConfigValueValid(config, value);

  async function handleRotate() {
    const confirmed = await sayno.confirm({
      title: tRoot("settings.rotate.confirmTitle"),
      description: tRoot("settings.rotate.confirmDescription"),
      variant: "destructive",
    });
    if (!confirmed) return;

    rotateConfig.mutate(node.fullKey, {
      onSuccess: (data) => {
        const newValue = (data as { config?: { value?: string | null } }).config?.value;
        if (newValue) {
          setRevealedValue(newValue);
          onChange(newValue);
        }
      },
    });
  }

  const descriptionLinkHref = t(`${node.fullKey}.descriptionLink` as never, { defaultValue: "" });

  function renderControl() {
    // image → dedicated uploader (file pick + URL import)
    if (config!.type === "image") {
      return <ConfigImageUploader config={config!} />;
    }

    // boolean → Switch, right-aligned
    if (config!.type === "boolean") {
      return (
        <div className="flex justify-start pt-0.5 sm:justify-end">
          <Switch
            checked={value === "true"}
            disabled={isDisabled}
            onChange={checked => onChange(checked ? "true" : "false")}
          />
        </div>
      );
    }

    // list type → Checkbox group
    if (config!.type === "list") {
      const currentValues = value ? value.split(";").filter(Boolean) : [];
      const availableOptions = (config!.options ?? "").split(";");

      return (
        <div className="flex flex-col gap-1">
          {availableOptions.map((option: string) => {
            const isChecked = currentValues.includes(option);
            return (
              <div
                key={option}
                className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-surface-2/50"
              >
                <Checkbox
                  id={`${node.fullKey}-${option}`}
                  label={option}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(checked) => {
                    const newValues = checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    onChange(newValues.join(";"));
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // select (options set, non-list type)
    if (config!.options) {
      const options = config!.options.split(";");
      return (
        <Select value={value ?? undefined} disabled={isDisabled} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // rotatable secret → masked + regenerate button
    if (config!.secret && isRotatable) {
      return (
        <div className="flex w-full items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              readOnly
              disabled
              type="password"
              value="placeholder"
              placeholder="••••••••"
              aria-label="Hidden secret value"
              className="pr-9"
            />
            <Lock className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          </div>
          <Button type="button" variant="outline" disabled={isDisabled || rotateConfig.isPending} onClick={handleRotate} className="shrink-0">
            <RefreshCw className={cn("size-3.5", rotateConfig.isPending && "animate-spin")} />
            {t(`${node.fullKey}.regenerate` as never)}
          </Button>
        </div>
      );
    }

    // editable secret
    if (config!.secret) {
      const isSet = config!.isOverridden;
      return (
        <div className="flex w-full flex-col gap-1.5">
          <Input
            type="password"
            value={value ?? ""}
            disabled={isDisabled}
            onChange={e => onChange(e.target.value)}
            placeholder={isSet ? "••••••••" : config!.nullable ? t("secretField.notSet") : "••••••••"}
            invalid={isInvalid}
          />
          {isSet && !value && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <CheckCircle2 className="size-3 shrink-0 text-sage" />
              <span>{t("secretField.configured")}</span>
            </div>
          )}
        </div>
      );
    }

    // multiline text
    if (config!.multiline) {
      return (
        <Textarea
          value={value ?? ""}
          disabled={isDisabled}
          onChange={e => onChange(e.target.value)}
          placeholder={config!.nullable ? "null" : undefined}
          aria-invalid={isInvalid}
        />
      );
    }

    // plain string / number
    return (
      <div className="flex w-full items-center gap-2">
        <Input
          type={config!.type === "number" ? "number" : "text"}
          value={value ?? ""}
          disabled={isDisabled}
          onChange={e => onChange(e.target.value)}
          placeholder={config!.nullable ? "null" : undefined}
          invalid={isInvalid}
        />
        {isRotatable && (
          <Button type="button" variant="outline" disabled={isDisabled || rotateConfig.isPending} onClick={handleRotate} className="shrink-0">
            <RefreshCw className={cn("size-3.5", rotateConfig.isPending && "animate-spin")} />
            {t(`${node.fullKey}.regenerate` as never)}
          </Button>
        )}
      </div>
    );
  }

  const tag = configTypeTag(config);
  const showDefault = !config.secret && config.defaultValue !== null && config.defaultValue !== "";

  return (
    <>
      {revealedValue && (
        <SecretRevealDialog value={revealedValue} onClose={() => setRevealedValue(null)} />
      )}
      <div className={cn("grid grid-cols-1 items-start gap-x-8 gap-y-3 px-6 py-5 transition-opacity md:grid-cols-[0.9fr_1.1fr]", isDisabled && "pointer-events-none opacity-40")}>
        {/* Left: name, type tag, description, key + default, metadata */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13.5px] font-semibold leading-tight tracking-tight text-ink">
              {t(`${node.fullKey}.label` as never)}
            </h3>
            {config.isOverridden && (
              <span className="size-1.5 shrink-0 rounded-full bg-amber ring-2 ring-amber/15" aria-label="Modified" title="Valeur modifiée" />
            )}
            <span className={cn("rounded border px-1.25 py-px font-mono text-[10px] font-medium", tag.secret ? "border-ink bg-ink text-white" : "border-line bg-surface-2 text-muted")}>
              {tag.label}
            </span>
          </div>
          <p className="mt-1.5 max-w-115 text-xs/relaxed text-muted">
            <Trans
              i18nKey={`settings.config.${node.fullKey}.description` as never}
              ns="web"
              components={{
                docLink: (
                  <a
                    href={descriptionLinkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  />
                ),
              }}
            />
          </p>
          <div className="mt-2.5 font-mono text-[10px] text-faint">
            <strong className="font-medium text-muted">{node.fullKey}</strong>
            {showDefault && ` · ${t("settings.fieldDefault")} : ${config.defaultValue}`}
          </div>
          {config.isOverridden && config.updatedAt && (
            <time className="mt-2 block text-[10.5px] text-faint">
              {new Date(config.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              {config.updatedBy && ` · ${config.updatedBy}`}
            </time>
          )}
        </div>

        {/* Right: control */}
        <div className="flex min-w-0 flex-col gap-1.5">
          {renderControl()}
          {isInvalid && <p className="text-[10.5px] text-coral-deep">{tRoot("form.invalid")}</p>}
        </div>
      </div>
    </>
  );
}
