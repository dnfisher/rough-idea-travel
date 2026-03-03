import { NextResponse, NextRequest } from "next/server"
import { handlers } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {}

  // Try to actually invoke the auth handler for signin/google
  try {
    const signinUrl = new URL("/api/auth/signin/google", req.url)
    const testReq = new Request(signinUrl.toString(), { method: "GET" })
    const response = await handlers.GET(testReq as NextRequest)
    results.signin_status = response.status
    results.signin_location = response.headers.get("location")
  } catch (e: unknown) {
    results.signin_error = {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 8).join("\n") : undefined,
      name: e instanceof Error ? e.name : undefined,
    }
  }

  return NextResponse.json(results)
}
