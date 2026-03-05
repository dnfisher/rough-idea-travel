import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_API_PREFIXES = [
  "/api/favorites",
  "/api/wishlists",
  "/api/user",
  "/api/share",
];

// Directives that do not need a per-request value.
// script-src is intentionally absent — middleware sets it with the nonce.
const STATIC_CSP_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
  "font-src 'self' https://api.fontshare.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth guard — unchanged logic, just called differently
  const isProtected = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtected) {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Nonce generation
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    ...STATIC_CSP_DIRECTIVES,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  ].join("; ");

  // Forward nonce to Server Components via request header.
  // Next.js App Router reads x-nonce automatically for its own bootstrap scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files.
    // Auth guard logic inside still only applies to PROTECTED_API_PREFIXES.
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
