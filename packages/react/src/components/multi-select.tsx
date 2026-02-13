"use client";

import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "~react/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "~react/components/popover";
import { cn } from "~react/lib/utils";

export type MultiSelectOption<T = string | number> = {
  value: T;
  label: string;
};

type MultiSelectProps<T = string | number> = {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function MultiSelect<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className,
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = options.filter(option => value.includes(option.value));

  const handleToggle = (optionValue: T) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: T, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
            className,
          )}
          data-placeholder={selectedOptions.length === 0 ? "" : undefined}
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedOptions.length === 0
              ? (
                  <span className="text-muted-foreground">{placeholder}</span>
                )
              : (
                  selectedOptions.map(option => (
                    <Badge
                      key={String(option.value)}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {option.label}
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                        onClick={e => handleRemove(option.value, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRemove(option.value, e as unknown as React.MouseEvent);
                          }
                        }}
                      >
                        <XIcon className="size-3" />
                      </span>
                    </Badge>
                  ))
                )}
          </div>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
        <div className="max-h-60 overflow-y-auto">
          {options.length === 0
            ? (
                <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                  No options available
                </div>
              )
            : (
                options.map(option => (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={cn(
                      "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent",
                    )}
                    onClick={() => handleToggle(option.value)}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border",
                        value.includes(option.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input",
                      )}
                    >
                      {value.includes(option.value) && <CheckIcon className="size-3" />}
                    </span>
                    {option.label}
                  </button>
                ))
              )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
