import type en from "~shared/i18n/en";

declare module "i18next" {
  type CustomTypeOptions = {
    defaultNS: "web";
    resources: typeof en;
  };
}
