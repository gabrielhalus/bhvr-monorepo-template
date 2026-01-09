import type { ConfigNode } from "~shared/types/db/runtime-configs.types";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@bunstack/react/components/badge";
import { Button } from "@bunstack/react/components/button";
import { Checkbox } from "@bunstack/react/components/checkbox";
import { Input } from "@bunstack/react/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bunstack/react/components/select";
import { Switch } from "@bunstack/react/components/switch";
import { useDebouncedCallback } from "@bunstack/react/hooks/use-debounced-callback";
import { api } from "~react/lib/http";
import { inferConfigValue } from "~shared/helpers/infer-config-value";

function createSchema(type: "string" | "number" | "boolean" | "list", nullable: boolean) {
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
    case "list":
      schema = z.string();
      break;
    default:
      schema = z.string();
  }

  return nullable ? schema.nullable() : schema;
}

function parseValue(value: string, type: "string" | "number" | "boolean" | "list") {
  switch (type) {
    case "number":
      return value === "" ? null : Number(value);
    case "boolean":
      return value === "true";
    case "list":
    case "string":
    default:
      return value;
  }
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

type RuntimeConfig = ConfigNode["config"];

function evaluateDisabledCondition(
  disabledWhen: string | null | undefined,
  allConfigs: RuntimeConfig[],
): boolean {
  if (!disabledWhen)
    return false;

  const notEqualIndex = disabledWhen.indexOf("!=");
  const equalIndex = disabledWhen.indexOf("=");

  if (equalIndex === -1)
    return false;

  const isNotEqual = notEqualIndex !== -1 && notEqualIndex < equalIndex;
  const operatorIndex = isNotEqual ? notEqualIndex : equalIndex;
  const operatorLength = isNotEqual ? 2 : 1;

  const configKey = disabledWhen.slice(0, operatorIndex);
  const expectedValue = disabledWhen.slice(operatorIndex + operatorLength);

  const config = allConfigs.find(c => c.configKey === configKey);

  if (!config)
    return false;

  const actualValue = String(config.value ?? "");
  const isEqual = actualValue === expectedValue;

  return isNotEqual ? !isEqual : isEqual;
}

function FreeListInput({ values, onChange, disabled }: { values: string[]; onChange: (values: string[]) => void; disabled?: boolean }) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue("");
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-56">
      <div className="flex gap-1.5">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add item..."
          disabled={disabled}
          className="flex-1 h-8 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          className="h-8 px-2.5"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map(value => (
            <Badge
              key={value}
              variant="secondary"
              className="gap-1 pr-1 group hover:bg-secondary/80 transition-colors"
            >
              <span className="max-w-32 truncate">{value}</span>
              <button
                type="button"
                onClick={() => handleRemove(value)}
                className="rounded-sm p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                aria-label={`Remove ${value}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function NodeForm({ node, allConfigs }: { node: ConfigNode; allConfigs: RuntimeConfig[] }) {
  const { t } = useTranslation("web", { keyPrefix: "pages.settings.config.section" });
  const queryClient = useQueryClient();

  const { config } = node;
  const isDisabled = evaluateDisabledCondition(config.disabledWhen, allConfigs);

  const schema = createSchema(config.type, config.nullable);

  const form = useForm({
    defaultValues: { value: stringifyValue(parseValue(config.value, config.type)) },
    onSubmit: async ({ value: { value } }) => {
      try {
        const parsedValue = inferConfigValue(value);
        schema.parse(parsedValue);

        const res = await api.config[":key"].$put({
          param: { key: node.fullKey },
          json: { value },
        });

        if (!res.ok) {
          throw new Error("Failed to save configuration");
        }

        queryClient.setQueryData(["get-runtime-configs"], (oldData: { configs: RuntimeConfig[] } | undefined) => {
          if (!oldData)
            return oldData;
          return {
            ...oldData,
            configs: oldData.configs.map(c =>
              c.configKey === node.fullKey ? { ...c, value } : c,
            ),
          };
        });

        toast.success("Configuration saved successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save configuration");
        throw error;
      }
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
            if (config.type === "boolean")
              return undefined;
            try {
              const parsed = parseValue(value, config.type);
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

            if (config.options) {
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

            return (
              <FreeListInput
                values={currentValues}
                disabled={isDisabled}
                onChange={(newValues) => {
                  field.handleChange(newValues.join(";"));
                  handleAutoSave();
                }}
              />
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
