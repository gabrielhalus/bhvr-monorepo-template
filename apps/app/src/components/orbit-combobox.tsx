import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Input } from "~orbit/components/ui/Input";
import { cn } from "~orbit/lib/utils";

type OrbitComboboxProps<T> = {
  value: string;
  onValueChange: (value: string) => void;
  items: T[];
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  emptyText?: string;
  minChars?: number;
  header?: React.ReactNode;
  name?: string;
  inputClassName?: string;
  onBlur?: () => void;
};

/**
 * Native Orbit combobox — an `Input` plus a floating results panel. Replaces the
 * `~react` shadcn combobox on migrated pages (rebuild natively, never embed).
 * The caller owns the query text (`value`/`onValueChange`) and the fetched
 * `items`; this component only handles open/blur state and rendering.
 *
 * The panel is portalled to `document.body` and positioned with `fixed` so it
 * escapes any `overflow-hidden` ancestor (e.g. form section cards) instead of
 * being clipped.
 */
export function OrbitCombobox<T>({
  value,
  onValueChange,
  items,
  onSelect,
  getKey,
  renderItem,
  placeholder,
  leadingIcon,
  emptyText,
  minChars = 2,
  header,
  name,
  inputClassName,
  onBlur,
}: OrbitComboboxProps<T>) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const showEmpty = emptyText != null && value.trim().length >= minChars && items.length === 0;
  const open = focused && (items.length > 0 || showEmpty);

  const updateRect = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open, updateRect]);

  return (
    <div className="relative w-full">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint [&_svg]:size-4">{leadingIcon}</span>
      )}
      <Input
        ref={inputRef}
        name={name}
        value={value}
        placeholder={placeholder}
        autoComplete="new-password"
        data-lpignore="true"
        data-1p-ignore="true"
        className={cn(leadingIcon && "pl-9", inputClassName)}
        onChange={e => onValueChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => {
            setFocused(false);
            onBlur?.();
          }, 150);
        }}
      />

      {open && rect && createPortal(
        <div
          style={{ position: "fixed", top: rect.top + 6, left: rect.left, width: rect.width }}
          className="z-50 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop"
          onMouseDown={() => {
            // Keep the panel open through the click (blur fires first).
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {header}
          {items.length === 0
            ? <div className="px-2.5 py-2 text-xs text-muted">{emptyText}</div>
            : items.map(item => (
                <button
                  key={getKey(item)}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setFocused(false);
                  }}
                  className="flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  {renderItem(item)}
                </button>
              ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
