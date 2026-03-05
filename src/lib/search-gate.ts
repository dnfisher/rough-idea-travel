import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "ri_searches";
export const MAX_FREE_SEARCHES = 3;

const SECRET = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("[search-gate] AUTH_SECRET env var is required");
  return s;
};

export function readSearchCount(cookieValue: string | undefined): number {
  if (!cookieValue) return 0;
  const dot = cookieValue.lastIndexOf(".");
  if (dot < 0) return 0;
  const countStr = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);
  const count = parseInt(countStr, 10);
  if (!Number.isFinite(count) || count < 0) return 0;
  const expected = createHmac("sha256", SECRET()).update(countStr).digest("hex");
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return 0;
    return timingSafeEqual(sigBuf, expBuf) ? count : 0;
  } catch {
    return 0;
  }
}

export function makeSearchCookie(count: number): string {
  const countStr = String(count);
  const sig = createHmac("sha256", SECRET()).update(countStr).digest("hex");
  return `${countStr}.${sig}`;
}

export function isSearchAllowed(count: number): boolean {
  return count < MAX_FREE_SEARCHES;
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};
