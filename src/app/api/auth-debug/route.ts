import { NextResponse } from "next/server"

export async function GET() {
  const results: Record<string, unknown> = {}
  
  // Test Google OIDC discovery
  try {
    const r = await fetch("https://accounts.google.com/.well-known/openid-configuration")
    results.google_oidc = { status: r.status, ok: r.ok }
  } catch (e) {
    results.google_oidc = { error: String(e) }
  }

  // Check env vars (non-sensitive)
  results.env = {
    AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID_SET: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET_SET: !!process.env.AUTH_GOOGLE_SECRET,
    AUTH_GITHUB_ID_SET: !!process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET_SET: !!process.env.AUTH_GITHUB_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length,
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json(results)
}
