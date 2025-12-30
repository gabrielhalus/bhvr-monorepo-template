export const appConfig = {
  authentication: {
    register: {
      type: "boolean" as const,
      default: true,
      description: "authentication.register.description",
    },
  },
} as const;

export type ConfigDefinition = typeof appConfig;
export type ConfigValue = string | number | boolean | string[];
