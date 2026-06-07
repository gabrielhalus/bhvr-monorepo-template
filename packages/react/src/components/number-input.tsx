import { MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "~react/lib/utils";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "./input-group";

type BaseProps = {
  onChangeValue?: (value: string) => void;
  allowFloats?: boolean;
} & React.ComponentProps<"input">;

type NumberInputProps
  = | (BaseProps & {
    showButtons?: true;
    prefix?: never;
    suffix?: never;
  })
  | (BaseProps & {
    showButtons?: false;
    prefix?: string;
    suffix?: string;
  });

function NumberInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  onChangeValue,
  prefix,
  suffix,
  showButtons = false,
  allowFloats = true,
  className,
  ...props
}: NumberInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Local state to track exactly what the user types (e.g., "12.")
  const [displayValue, setDisplayValue] = React.useState<string>(value?.toString() ?? "");

  // Update local state when the prop value changes externally
  React.useEffect(() => {
    const stringProp = value?.toString() ?? "";
    // Avoid resetting if the user is in the middle of typing a decimal
    if (Number.parseFloat(displayValue) !== Number.parseFloat(stringProp) || (displayValue === "" && stringProp !== "")) {
      setDisplayValue(stringProp);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let nextValue = e.target.value.replace(",", ".");

    // Strip leading zeros unless it's "0."
    if (nextValue.length > 1 && nextValue.startsWith("0") && !nextValue.startsWith("0.")) {
      nextValue = nextValue.replace(/^0+/, "");
      if (nextValue === "") nextValue = "0";
    }

    const regex = allowFloats ? /^\d*(?:\.\d*)?$/ : /^\d*$/;

    if (nextValue === "" || regex.test(nextValue)) {
      setDisplayValue(nextValue); // Update UI immediately

      // Only notify parent if it's a valid number or empty
      const target = e.target;
      target.value = nextValue;
      onChange?.(e);
      onChangeValue?.(nextValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const step = props.step !== undefined ? Number(props.step) : undefined;
    const min = props.min !== undefined ? Number(props.min) : undefined;
    const max = props.max !== undefined ? Number(props.max) : undefined;

    let num = displayValue === "" || displayValue === "." ? 0 : Number(displayValue);

    if (step !== undefined && step > 0) {
      const base = min ?? 0;
      num = Math.round((num - base) / step) * step + base;
    }

    if (min !== undefined) num = Math.max(num, min);
    if (max !== undefined) num = Math.min(num, max);

    const stepDecimals = step !== undefined ? (step.toString().split(".")[1]?.length ?? 0) : 0;
    const next = stepDecimals > 0 ? num.toFixed(stepDecimals) : String(num);

    if (next !== displayValue) {
      setDisplayValue(next);

      const target = e.target as HTMLInputElement;
      target.value = next;

      const event = {
        ...e,
        target,
        currentTarget: target,
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      onChange?.(event);
      onChangeValue?.(next);
    }

    onBlur?.(e);
  };

  const handleStep = (direction: 1 | -1) => {
    const step = Number(props.step ?? 1);
    const min = props.min !== undefined ? Number(props.min) : undefined;
    const max = props.max !== undefined ? Number(props.max) : undefined;
    const current = Number(displayValue) || 0;

    let next = current + direction * step;
    if (min !== undefined) next = Math.max(next, min);
    if (max !== undefined) next = Math.min(next, max);

    const stepDecimals = step.toString().split(".")[1]?.length ?? 0;
    const nextStr = stepDecimals > 0 ? next.toFixed(stepDecimals) : String(next);

    setDisplayValue(nextStr);
    onChangeValue?.(nextStr);

    if (onChange && inputRef.current) {
      const target = inputRef.current;
      target.value = nextStr;
      onChange({ target, currentTarget: target } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleMinus = () => handleStep(-1);
  const handlePlus = () => handleStep(1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleStep(-1);
    }
    onKeyDown?.(e);
  };

  return (
    <InputGroup>
      {showButtons && (
        <InputGroupAddon>
          <InputGroupButton disabled={props.disabled} size="icon-xs" variant="outline" onClick={handleMinus}>
            <MinusIcon className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
      {prefix && (
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput
        {...props}
        ref={inputRef}
        type="text"
        inputMode={allowFloats ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(className, showButtons ? "text-center" : "")}
      />
      {suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
      {showButtons && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton disabled={props.disabled} size="icon-xs" variant="outline" onClick={handlePlus}>
            <PlusIcon className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

export { NumberInput };
