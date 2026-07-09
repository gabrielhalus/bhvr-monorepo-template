import { useTranslation } from "react-i18next";

/**
 * Discreet build indicator pinned to the bottom-right corner of the viewport.
 * Non-interactive so it never blocks clicks or toasts stacked in that corner.
 */
export function BuildBadge() {
  const { t } = useTranslation("web");

  return (
    <div
      data-slot="build-badge"
      className="pointer-events-none fixed bottom-1.5 right-2 z-10 select-none text-[11px] text-faint"
    >
      {t("generic.build")}
      {" "}
      <span className="font-mono">{__BUILD_HASH__}</span>
    </div>
  );
}
