import type { ConfigNode, RuntimeConfig } from "~shared/types/db/runtime-configs.types";

import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useUpdateRuntimeConfig } from "@/hooks/runtime-configs/use-update-runtime-config";
import { Badge } from "~react/components/badge";
import { Checkbox } from "~react/components/checkbox";
import { Input } from "~react/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~react/components/select";
import { Switch } from "~react/components/switch";
import { useDebouncedCallback } from "~react/hooks/use-debounced-callback";
import { inferConfigValue } from "~shared/helpers/infer-config-value";

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

function evaluateDisabledCondition(disabledWhen: string | null | undefined, allConfigs: RuntimeConfig[]): boolean {
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

export function NodeForm({ node, allConfigs }: { node: ConfigNode; allConfigs: RuntimeConfig[] }) {
  const { t } = useTranslation("web", { keyPrefix: "pages.settings.config" });
  const updateRuntimeConfig = useUpdateRuntimeConfig();

  const { config } = node;
  const isDisabled = evaluateDisabledCondition(config.disabledWhen, allConfigs);

  const schema = createSchema(config.type, config.nullable);

  const form = useForm({
    defaultValues: { value: config.value },
    onSubmit: async ({ value: { value } }) => {
      const finalValue = config.nullable && (value === "" || value === null) ? null : value;
      const parsedValue = inferConfigValue(finalValue ?? "");
      schema.parse(parsedValue);

      await updateRuntimeConfig.mutateAsync({ key: node.fullKey, value: finalValue });
    },
  });

  const handleAutoSave = useDebouncedCallback(() => form.handleSubmit(), 500);

  return (
    <div className={`flex items-center justify-between gap-8 first:pt-0 last:pb-0 py-5 not-last:border-b transition-opacity ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{t(`${node.fullKey}.label`)}</h3>
          <Badge variant="secondary">
            {config.type}
            {config.nullable && "?"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{t(`${node.fullKey}.description`)}</p>
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
                  handleAutoSave();
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
                          handleAutoSave();
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
                  handleAutoSave();
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

          return (
            <div className="flex flex-col items-end gap-1">
              <Input
                id={field.name}
                type={config.type === "number" ? "number" : "text"}
                value={field.state.value}
                disabled={isDisabled}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                onKeyUp={handleAutoSave}
                placeholder={config.nullable ? "null" : undefined}
                aria-invalid={field.state.meta.errors.length > 0}
                className="w-48"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-xs text-destructive">{field.state.meta.errors[0]}</span>
              )}
            </div>
          );
        }}
      </form.Field>
    </div>
  );
}
