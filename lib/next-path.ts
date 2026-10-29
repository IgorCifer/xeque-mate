export const NEXT_PATH_HEADER = "x-next-path";

const BASE = "http://localhost";
const AUTH_PAGES = ["/login", "/registrar"];

export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE || AUTH_PAGES.includes(url.pathname)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function authPagePath(page: "/login" | "/registrar", next: unknown): string {
  const path = safeNextPath(next);
  return path ? `${page}?next=${encodeURIComponent(path)}` : page;
}
