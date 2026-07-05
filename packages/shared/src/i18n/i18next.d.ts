import type en from "./en";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "web";
    resources: typeof en;
  }
}
