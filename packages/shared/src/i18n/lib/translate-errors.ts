import type { TFunction } from "i18next";

/**
 * Translates zod validation error messages that use translation keys.
 *
 * If an error message starts with "errors.", it's treated as a translation key
 * and will be translated using the provided translation function.
 *
 * @param errors - Array of error objects with optional message property
 * @param t - Translation function from react-i18next or i18next
 * @returns Array of errors with translated messages
 *
 * @example
 * ```tsx
 * const { t } = useTranslation("web");
 * const translatedErrors = translateErrors(field.state.meta.errors, t);
 * <FieldError errors={translatedErrors} />
 * ```
 */
export function translateErrors(
  errors: Array<{ message?: string } | undefined>,
  t: TFunction,
): Array<{ message?: string } | undefined> {
  return errors.map((error) => {
    if (!error?.message)
      return error;
    // Check if the message is a translation key (starts with "errors.")
    if (error.message.startsWith("errors.")) {
      return { ...error, message: t(error.message as never) };
    }
    return error;
  });
}
