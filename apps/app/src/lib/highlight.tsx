import React from "react";

/** Wrap occurrences of `query` within `text` in <mark> for emphasis. */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  let offset = 0;
  return parts.map((part) => {
    const start = offset;
    offset += part.length;
    return part.toLowerCase() === query.toLowerCase()
      ? <mark key={start} className="bg-transparent font-semibold text-accent">{part}</mark>
      : part;
  });
}
