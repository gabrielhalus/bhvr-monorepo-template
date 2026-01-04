/**
 * Application configuration schema defining runtime configuration keys and their metadata.
 * Each configuration entry includes its type, default value, and description key for i18n.
 */
export const config = {
  /**
   * Authentication-related configuration options
   */
  authentication: {
    /**
     * User registration configuration
     * Controls whether new users can register for accounts
     */
    register: {
      type: "boolean" as const,
      default: true,
      description: "authentication.register.description",
    },
  },
} as const;
