import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaDiscord, FaTelegram } from "react-icons/fa";

import DiscordForm from "./forms/discord";
import TelegramForm from "./forms/telegram";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@bunstack/react/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@bunstack/react/components/field";
import { RadioCard, RadioCardGroup } from "@bunstack/react/components/radio-card";
import { NotificationProviderType } from "@bunstack/shared/types/notification-providers";

export default function CreateForm({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const { t } = useTranslation("web");
  const [selectedType, setSelectedType] = useState<NotificationProviderType | undefined>(NotificationProviderType.DISCORD);

  const providerFields = useMemo(() => {
    if (!selectedType)
      return null;

    switch (selectedType) {
      case NotificationProviderType.DISCORD:
        return <DiscordForm setOpen={setOpen} />;
      case NotificationProviderType.TELEGRAM:
        return <TelegramForm setOpen={setOpen} />;
      default:
        return null;
    }
  }, [selectedType, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("pages.settings.notifications.create.title")}</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>{t("pages.settings.notifications.create.providerType")}</FieldLabel>
            <RadioCardGroup
              value={selectedType}
              onValueChange={value => setSelectedType(value as NotificationProviderType)}
              className="grid-cols-2"
            >
              <RadioCard value={NotificationProviderType.DISCORD} color="#5865f2">
                <div className="flex flex-col items-center gap-2">
                  <FaDiscord className="size-10" color="#5865f2" />
                  <span>{t("pages.settings.notifications.providers.discord")}</span>
                </div>
              </RadioCard>
              <RadioCard value={NotificationProviderType.TELEGRAM} color="#0088cc">
                <div className="flex flex-col items-center gap-2">
                  <FaTelegram className="size-10" color="#0088cc" />
                  <span>{t("pages.settings.notifications.providers.telegram")}</span>
                </div>
              </RadioCard>
            </RadioCardGroup>
          </Field>
          {/* Dynamic fields based on provider */}
          {providerFields}
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
