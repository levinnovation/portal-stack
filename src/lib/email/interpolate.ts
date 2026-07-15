/** Replace Maizzle-style slot tokens while preserving the HTML document's safety. */
export function interpolateEmailHtml(html: string, slots: Record<string, unknown>): string {
  return html.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*\}\}/g, (_token, key: string) => {
    const value = slots[key];
    return value === undefined || value === null ? "" : escapeHtml(String(value));
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
