// ─── Design tokens (inlined — email clients strip <style>) ──────────────────

const O = {
  paper: "#f4f5f7",
  surface: "#ffffff",
  ink: "#181b21",
  muted: "#646b76",
  faint: "#98a0ac",
  line: "#e8eaee",
  accent: "#6c4af2",
} as const;

const FONT = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Turn a plain-text body into an email-client-safe HTML document.
 * All styling is inlined (clients strip <style>). URLs are linkified with the
 * brand accent and newlines become line breaks. An optional business name renders
 * a branded header band with an accent bar.
 */
function wrapHtml(body: string, businessName?: string): string {
  const html = escapeHtml(body)
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      url => `<a href="${url}" style="color:${O.accent};text-decoration:none;font-weight:600;">${url}</a>`,
    )
    .replace(/\n/g, "<br>");

  return wrapShell(html, businessName);
}

/** The email shell around an already-safe HTML body fragment. */
function wrapShell(html: string, businessName?: string): string {
  const brand = businessName?.trim() ?? "";
  const header = brand
    ? `<tr><td style="padding:22px 28px 18px;border-bottom:1px solid ${O.line};">`
    + `<span style="font-size:16px;font-weight:700;letter-spacing:-0.02em;color:${O.ink};">${escapeHtml(brand)}</span>`
    + `</td></tr>`
    : "";
  const footer = brand
    ? `<tr><td style="padding:16px 28px 22px;border-top:1px solid ${O.line};">`
    + `<span style="font-size:12px;color:${O.faint};">${escapeHtml(brand)}</span>`
    + `</td></tr>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">`
    + `<meta name="viewport" content="width=device-width,initial-scale=1"></head>`
    + `<body style="margin:0;padding:24px;background:${O.paper};font-family:${FONT};color:${O.ink};">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">`
    + `<tr><td align="center">`
    + `<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-collapse:separate;`
    + `background:${O.surface};border:1px solid ${O.line};border-radius:14px;overflow:hidden;`
    + `box-shadow:0 1px 2px rgba(16,24,40,0.04),0 1px 3px rgba(16,24,40,0.06);">`
    + `<tr><td style="height:3px;background:${O.accent};font-size:0;line-height:0;">&nbsp;</td></tr>${
      header
    }<tr><td style="padding:28px;line-height:1.6;font-size:15px;color:${O.ink};">${html}</td></tr>${
      footer
    }</table></td></tr></table></body></html>`;
}

/**
 * Wrap a plain-text body into an email-client-safe HTML document.
 * Use for transactional emails (e.g. password reset).
 */
export function wrapEmailHtml(body: string, businessName?: string): string {
  return wrapHtml(body, businessName);
}
