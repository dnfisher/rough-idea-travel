import { NextResponse, NextRequest } from "next/server"
import { handlers } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {}

  // Test with proper NextRequest (same as what the real auth handler gets)
  try {
    // Build a NextRequest that mirrors what /api/auth/signin/google would receive
    const signinUrl = new URL("/api/auth/signin/google", "https://rough-idea-travel.vercel.app")
    const testReq = new NextRequest(signinUrl.toString(), {
      method: "GET",
      headers: req.headers,
    })
    results.test_nextUrl = testReq.nextUrl?.href
    const response = await handlers.GET(testReq)
    results.signin_status = response.status
    results.signin_location = response.headers.get("location")
  } catch (e: unknown) {
    results.signin_error = {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 10).join("\n") : undefined,
      name: e instanceof Error ? e.name : undefined,
    }
  }

  return NextResponse.json(results)
}
