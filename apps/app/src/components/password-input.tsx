import type { PasswordRules } from "~shared/types/auth.types";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Check, Eye, EyeOff, X } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";

export type PasswordInputProps = {
  rules?: PasswordRules;
  checks?: Record<keyof PasswordRules, (val: string) => boolean>;
  showRequirements?: boolean;
  onValidationChange?: (isValid: boolean) => void;
} & Omit<React.ComponentProps<"input">, "type">;

type RequirementStatus = Record<keyof PasswordRules, boolean>;

function checkRequirements(password: string, checks?: Record<string, (val: string) => boolean>): RequirementStatus {
  if (!checks) return {} as RequirementStatus;
  return Object.fromEntries(
    Object.entries(checks).map(([key, fn]) => [key, fn(password)]),
  ) as RequirementStatus;
}

const RequirementItem = memo<{ label: string; satisfied: boolean; show: boolean }>(({ label, satisfied, show }) => {
  if (!show) return null;
  return (
    <div className={cn("flex items-center gap-2 text-sm transition-colors duration-200", satisfied ? "text-sage" : "text-muted")}>
      {satisfied ? <Check className="size-3 text-sage" /> : <X className="size-3 text-faint" />}
      <span>{label}</span>
    </div>
  );
});
RequirementItem.displayName = "RequirementItem";

/** Orbit-native password field: show/hide toggle + optional requirements checklist. */
export function PasswordInput({ ref, className, rules, checks, showRequirements = true, onValidationChange, onChange, value, ...props }: PasswordInputProps & { ref?: React.RefObject<HTMLInputElement | null> }) {
  const { t } = useTranslation("ui");

  const [showPassword, setShowPassword] = useState(false);
  const password = value?.toString() ?? "";

  const requirements = useMemo(() => checkRequirements(password, checks), [password, checks]);

  const isValid = useMemo(() => {
    if (!checks || !Object.keys(checks).length) return true;
    return Object.values(requirements).every(Boolean);
  }, [requirements, checks]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const toggle = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(prev => !prev);
  }, []);

  const requirementLabels = useMemo(() => {
    if (!rules) return {} as Record<keyof PasswordRules, string>;
    return {
      minLength: rules.minLength ? t("passwordInput.requirements.rules.minLength", { count: rules.minLength }) : "",
      minUppercase: rules.minUppercase ? t("passwordInput.requirements.rules.minUppercase", { count: rules.minUppercase }) : "",
      minLowercase: rules.minLowercase ? t("passwordInput.requirements.rules.minLowercase", { count: rules.minLowercase }) : "",
      minDigits: rules.minDigits ? t("passwordInput.requirements.rules.minDigits", { count: rules.minDigits }) : "",
      minSpecialChars: rules.minSpecialChars ? t("passwordInput.requirements.rules.minSpecialChars", { count: rules.minSpecialChars }) : "",
    } as Record<keyof PasswordRules, string>;
  }, [rules, t]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          value={value}
          type={showPassword ? "text" : "password"}
          onChange={onChange}
          className={cn("pr-10", className)}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? t("passwordInput.ariaLabels.hidePassword") : t("passwordInput.ariaLabels.showPassword")}
          onClick={toggle}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {showRequirements && rules && (
        <div className="space-y-1 rounded-md border border-line bg-surface-2/40 p-3">
          <p className="text-sm font-medium text-ink">{t("passwordInput.requirements.label")}</p>
          <div className="space-y-1">
            {(Object.keys(rules) as (keyof PasswordRules)[]).map(ruleKey => (
              <RequirementItem
                key={ruleKey}
                label={requirementLabels[ruleKey] ?? ""}
                satisfied={requirements[ruleKey] ?? false}
                show={!!rules[ruleKey]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
PasswordInput.displayName = "PasswordInput";
