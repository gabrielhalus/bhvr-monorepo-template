import { ENV } from "varlock/env";

import { getConfigs } from "~shared/queries/configs.queries";

export type SendEmailResult = { messageId: string; error?: never } | { error: string; messageId?: never };

/**
 * Whether a mail provider is fully configured (Resend API key + sender address).
 * Callers can branch on this to fall back to logging when no provider is set up.
 */
export async function isEmailProviderConfigured(): Promise<boolean> {
  const configs = await getConfigs(["email.apiKey", "email.fromAddress"]);
  const configMap = Object.fromEntries(configs.map(c => [c.configKey, c.value]));
  return Boolean(configMap["email.apiKey"] && configMap["email.fromAddress"]);
}

/**
 * Send a transactional email via Resend.
 * Reads the API key and sender identity from the config store on every call.
 * Returns the message id on success, or an error string on failure.
 */
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<SendEmailResult> {
  // Dev safety: outside production, never message a real recipient. If DEV_EMAIL_REDIRECT is set,
  // route the email to that test recipient (subject prefixed with the real target); otherwise skip.
  if (ENV.APP_ENV !== "production") {
    if (!ENV.DEV_EMAIL_REDIRECT) {
      // eslint-disable-next-line no-console
      console.log(`[Email] Skipped in ${ENV.APP_ENV} (set DEV_EMAIL_REDIRECT to test) — to: ${to}, subject: ${subject}`);
      return { messageId: "dev-skipped" };
    }
    // eslint-disable-next-line no-console
    console.log(`[Email] Redirecting in ${ENV.APP_ENV} — ${to} → ${ENV.DEV_EMAIL_REDIRECT}`);
    subject = `[DEV→${to}] ${subject}`;
    to = ENV.DEV_EMAIL_REDIRECT;
  }

  const configs = await getConfigs(["email.apiKey", "email.fromAddress", "email.fromName"]);
  const configMap = Object.fromEntries(configs.map(c => [c.configKey, c.value]));
  const apiKey = configMap["email.apiKey"];
  const fromAddress = configMap["email.fromAddress"];
  const fromName = configMap["email.fromName"];

  if (!apiKey) {
    return { error: "Resend API key is not configured" };
  }
  if (!fromAddress) {
    return { error: "Sender email address is not configured" };
  }

  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });

    const data = await res.json() as { id?: string; message?: string; name?: string };

    if (!res.ok) {
      return { error: data.message ?? data.name ?? `Resend error ${res.status}` };
    }

    return { messageId: data.id! };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error sending email" };
  }
}
