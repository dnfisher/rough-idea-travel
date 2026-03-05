import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_API_PREFIXES = [
  "/api/favorites",
  "/api/wishlists",
  "/api/user",
  "/api/share",
];

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const config = {
  matcher: [
    "/api/favorites/:path*",
    "/api/wishlists/:path*",
    "/api/user/:path*",
    "/api/share/:path*",
  ],
};
