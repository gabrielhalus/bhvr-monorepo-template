import type { NotificationProvider } from "@bunstack/shared/types/notification-providers";
import type { Row } from "@tanstack/react-table";

import { EditIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import EditForm from "./edit-form";
import { Button } from "@bunstack/react/components/button";

export default function Actions({ row }: { row: Row<NotificationProvider> }) {
  const { t } = useTranslation("web");
  const [isFormOpen, setIsFormOpen] = useState(false);
  return (
    <>
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
          onClick={() => setIsFormOpen(true)}
          aria-label={t("pages.settings.notifications.actions.edit")}
        >
          <EditIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditForm open={isFormOpen} setOpen={setIsFormOpen} provider={row.original} />
    </>
  );
}
