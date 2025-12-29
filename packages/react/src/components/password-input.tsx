import type { PasswordRules } from "@bunstack/shared/types/auth.types";
import type { MouseEvent } from "react";

import { Check, Eye, EyeOff, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@bunstack/react/components/input-group";
import { cn } from "@bunstack/react/lib/utils";

export type PasswordInputProps = {
  rules?: PasswordRules;
  checks?: Record<keyof PasswordRules, (val: string) => boolean>;
  showRequirements?: boolean;
  onValidationChange?: (isValid: boolean) => void;
} & Omit<React.ComponentProps<"input">, "type">;

type RequirementStatus = Record<keyof PasswordRules, boolean>;

function checkRequirements(password: string, checks?: Record<string, (val: string) => boolean>): RequirementStatus {
  if (!checks)
    return {} as RequirementStatus;

  return Object.fromEntries(
    Object.entries(checks).map(([key, fn]) => [key, fn(password)]),
  ) as RequirementStatus;
}

const RequirementItem = React.memo<{
  label: string;
  satisfied: boolean;
  show: boolean;
}>(({ label, satisfied, show }) => {
  if (!show)
    return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-colors duration-200",
        satisfied ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
      )}
    >
      {satisfied ? <Check className="size-3 text-green-600 dark:text-green-400" /> : <X className="size-3 text-muted-foreground" />}
      <span>{label}</span>
    </div>
  );
});

RequirementItem.displayName = "RequirementItem";

export function PasswordInput({
  ref,
  className,
  rules,
  checks,
  showRequirements = true,
  onValidationChange,
  onChange,
  value,
  ...props
}: PasswordInputProps & { ref?: React.RefObject<HTMLInputElement | null> }) {
  const { t } = useTranslation("ui");

  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState(value?.toString() || "");

  const requirements = React.useMemo(() => checkRequirements(password, checks), [password, checks]);

  const isValid = React.useMemo(() => {
    if (!checks || Object.keys(checks).length === 0) {
      // If no checks are provided, consider the password valid
      return true;
    }
    return Object.values(requirements).every(Boolean);
  }, [requirements, checks]);

  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const togglePasswordVisibility = React.useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(prev => !prev);
  }, []);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setPassword(newValue);
      onChange?.(e);
    },
    [onChange],
  );

  // Requirement labels
  const requirementLabels = React.useMemo(
    () => {
      if (!rules)
        return {};

      return {
        minLength: rules.minLength ? t("passwordInput.requirements.rules.minLength", { count: rules.minLength }) : "",
        minUppercase: rules.minUppercase ? t("passwordInput.requirements.rules.minUppercase", { count: rules.minUppercase }) : "",
        minLowercase: rules.minLowercase ? t("passwordInput.requirements.rules.minLowercase", { count: rules.minLowercase }) : "",
        minDigits: rules.minDigits ? t("passwordInput.requirements.rules.minDigits", { count: rules.minDigits }) : "",
        minSpecialChars: rules.minSpecialChars ? t("passwordInput.requirements.rules.minSpecialChars", { count: rules.minSpecialChars }) : "",
      };
    },
    [rules, t],
  );

  return (
    <div className="space-y-2">
      <InputGroup>
        <InputGroupInput
          {...props}
          type={!showPassword ? "password" : "text"}
          onChange={handleChange}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="ghost"
            aria-label={!showPassword ? t("passwordInput.ariaLabels.showPassword") : t("passwordInput.ariaLabels.hidePassword")}
            type="button"
            tabIndex={-1}
            onClick={togglePasswordVisibility}
          >
            {!showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {showRequirements && rules && (
        <div className="space-y-1 rounded-md border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium text-foreground">{t("passwordInput.requirements.label")}</p>
          <div className="space-y-1">
            {(Object.keys(rules) as (keyof PasswordRules)[]).map(ruleKey => (
              <RequirementItem
                key={ruleKey}
                label={requirementLabels[ruleKey] || ""}
                satisfied={requirements[ruleKey] || false}
                show={!!rules[ruleKey]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
