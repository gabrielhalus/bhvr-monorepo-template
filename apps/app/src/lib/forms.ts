import type { KeyboardEvent } from "react";

/**
 * Prevents the browser's "implicit submission" — hitting Enter inside a single
 * text field submitting the whole form. Wire it on a `<form onKeyDown={...}>`.
 *
 * Enter is left untouched inside `<textarea>` (newlines) and on `<button>`
 * elements (so a focused submit button still works via keyboard). IME
 * composition is respected. Submitting stays explicit — via the submit button.
 */
export function blockEnterSubmit(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "TEXTAREA" || tag === "BUTTON") return;
  e.preventDefault();
}
