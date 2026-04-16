import type { Config, ConfigNode } from "~shared/types/db/configs.types";

import { useForm } from "@tanstack/react-form";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { z } from "zod";

import { useRotateConfig } from "@/hooks/configs/use-rotate-config";
import { useUpdateConfig } from "@/hooks/configs/use-update-config";
import { Badge } from "~react/components/badge";
import { Button } from "~react/components/button";
import { Checkbox } from "~react/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~react/components/dialog";
import { Input } from "~react/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~react/components/select";
import { Switch } from "~react/components/switch";
import { Textarea } from "~react/components/textarea";
import { inferConfigValue } from "~shared/helpers/infer-config-value";

const ROTATABLE_KEYS = new Set(["security.jwt.secret"]);

function createSchema(type: "string" | "number" | "boolean", nullable: boolean) {
  let schema;

  switch (type) {
    case "string":
      schema = z.string();
      break;
    case "number":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    default:
      schema = z.string();
  }

  return nullable ? schema.nullable() : schema;
}

function evaluateDisabledCondition(disabledWhen: string | null | undefined, allConfigs: Config[]): boolean {
  if (!disabledWhen) {
    return false;
  }

  const notEqualIndex = disabledWhen.indexOf("!=");
  const equalIndex = disabledWhen.indexOf("=");

  if (equalIndex === -1) {
    return false;
  }

  const isNotEqual = notEqualIndex !== -1 && notEqualIndex < equalIndex;
  const operatorIndex = isNotEqual ? notEqualIndex : equalIndex;
  const operatorLength = isNotEqual ? 2 : 1;

  const configKey = disabledWhen.slice(0, operatorIndex);
  const expectedValue = disabledWhen.slice(operatorIndex + operatorLength);

  const config = allConfigs.find(c => c.configKey === configKey);

  if (!config) {
    return false;
  }

  const actualValue = String(config.value ?? "");
  const isEqual = actualValue === expectedValue;

  return isNotEqual ? !isEqual : isEqual;
}

function SecretRevealDialog({ value, onClose }: { value: string; onClose: () => void }) {
  const { t } = useTranslation("web", { keyPrefix: "pages.settings.secretReveal" });
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
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input readOnly value={value} className="font-mono text-xs flex-1" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
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

export function NodeForm({ node, allConfigs }: { node: ConfigNode; allConfigs: Config[] }) {
  const { t } = useTranslation("web", { keyPrefix: "pages.settings.config" });
  const updateConfig = useUpdateConfig();
  const rotateConfig = useRotateConfig();
  const [revealedValue, setRevealedValue] = useState<string | null>(null);

  const { config } = node;
  const isDisabled = evaluateDisabledCondition(config.disabledWhen, allConfigs);
  const isRotatable = ROTATABLE_KEYS.has(node.fullKey);

  const schema = createSchema(config.type, config.nullable);

  const form = useForm({
    defaultValues: { value: config.value },
    onSubmit: async ({ value: { value } }) => {
      const finalValue = config.nullable && (value === "" || value === null) ? null : value;
      const parsedValue = inferConfigValue(finalValue ?? "");
      schema.parse(parsedValue);

      await updateConfig.mutateAsync({ key: node.fullKey, value: finalValue });
    },
  });

  function handleRotate() {
    rotateConfig.mutate(node.fullKey, {
      onSuccess: (data) => {
        const newValue = (data as { config?: { value?: string | null } }).config?.value;
        if (newValue) setRevealedValue(newValue);
      },
    });
  }

  const descriptionLinkHref = t(`${node.fullKey}.descriptionLink`, { defaultValue: "" });

  return (
    <>
      {revealedValue && (
        <SecretRevealDialog value={revealedValue} onClose={() => setRevealedValue(null)} />
      )}
      <div className={`flex flex-col gap-3 first:pt-0 last:pb-0 py-5 not-last:border-b transition-opacity ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{t(`${node.fullKey}.label`)}</h3>
            <Badge variant="secondary">
              {config.type}
              {config.nullable && "?"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            <Trans
              i18nKey={`pages.settings.config.${node.fullKey}.description`}
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
        </div>

        <form.Field
          name="value"
          validators={{
            onChange: ({ value }) => {
              if (config.type === "boolean") {
                return undefined;
              }
              try {
                const parsed = inferConfigValue(value);
                schema.parse(parsed);
                return undefined;
              } catch {
                return "Invalid value";
              }
            },
          }}
        >
          {(field) => {
            if (config.type === "boolean") {
              return (
                <Switch
                  id={field.name}
                  checked={field.state.value === "true"}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    field.handleChange(checked ? "true" : "false");
                    form.handleSubmit();
                  }}
                />
              );
            }

            if (config.type === "list") {
              const currentValues = field.state.value ? field.state.value.split(";").filter(Boolean) : [];

              const availableOptions = config.options.split(";");
              return (
                <div className="flex flex-col gap-1">
                  {availableOptions.map((option: string) => {
                    const isChecked = currentValues.includes(option);
                    return (
                      <label
                        key={option}
                        htmlFor={`${field.name}-${option}`}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors group"
                      >
                        <Checkbox
                          id={`${field.name}-${option}`}
                          checked={isChecked}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            const newValues = checked
                              ? [...currentValues, option]
                              : currentValues.filter((v: string) => v !== option);
                            field.handleChange(newValues.join(";"));
                            form.handleSubmit();
                          }}
                        />
                        <span className={`text-sm transition-colors ${isChecked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            }

            if (config.options) {
              const options = config.options.split(";");
              return (
                <Select
                  value={field.state.value}
                  disabled={isDisabled}
                  onValueChange={(value) => {
                    field.handleChange(value);
                    form.handleSubmit();
                  }}
                >
                  <SelectTrigger className="w-48">
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

            if (config.secret) {
              return (
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    disabled
                    type="password"
                    value="placeholder"
                    placeholder="••••••••"
                    className="w-48"
                    aria-label="Hidden secret value"
                  />
                  {isRotatable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isDisabled || rotateConfig.isPending}
                      onClick={handleRotate}
                      title={t(`${node.fullKey}.regenerate`)}
                    >
                      <RefreshCw className={`size-4 ${rotateConfig.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
              );
            }

            if (config.multiline) {
              return (
                <div className="flex flex-col items-start gap-1">
                  <Textarea
                    id={field.name}
                    value={field.state.value ?? ""}
                    disabled={isDisabled}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={() => {
                      field.handleBlur();
                      if (field.state.value !== config.value) form.handleSubmit();
                    }}
                    placeholder={config.nullable ? "null" : undefined}
                    aria-invalid={field.state.meta.errors.length > 0}
                    className="w-64 min-h-20"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-destructive">{field.state.meta.errors[0]}</span>
                  )}
                </div>
              );
            }

            return (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    id={field.name}
                    type={config.type === "number" ? "number" : "text"}
                    value={field.state.value}
                    disabled={isDisabled}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={() => {
                      field.handleBlur();
                      if (field.state.value !== config.value) form.handleSubmit();
                    }}
                    placeholder={config.nullable ? "null" : undefined}
                    aria-invalid={field.state.meta.errors.length > 0}
                    className="w-48"
                  />
                  {isRotatable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isDisabled || rotateConfig.isPending}
                      onClick={handleRotate}
                      title={t(`${node.fullKey}.regenerate`)}
                    >
                      <RefreshCw className={`size-4 ${rotateConfig.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
                {field.state.meta.errors.length > 0 && (
                  <span className="text-xs text-destructive">{field.state.meta.errors[0]}</span>
                )}
              </div>
            );
          }}
        </form.Field>
      </div>
    </>
  );
}
