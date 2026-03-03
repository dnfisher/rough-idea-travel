import { NextResponse, NextRequest } from "next/server"
import { handlers } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {}
  const capturedLogs: unknown[] = []

  // Temporarily capture console.error to see NextAuth's logged errors
  const origError = console.error
  console.error = (...args: unknown[]) => {
    capturedLogs.push(args.map(a => a instanceof Error ? { name: a.name, message: a.message, stack: a.stack?.split("\n").slice(0,8).join("\n") } : String(a)))
    origError(...args)
  }

  try {
    const signinUrl = new URL("/api/auth/signin/google", "https://rough-idea-travel.vercel.app")
    const testReq = new NextRequest(signinUrl.toString(), {
      method: "GET",
      headers: req.headers,
    })
    const response = await handlers.GET(testReq)
    results.signin_status = response.status
    results.signin_location = response.headers.get("location")
  } catch (e: unknown) {
    results.signin_error = e instanceof Error ? { name: e.name, message: e.message, stack: e.stack?.split("\n").slice(0,10).join("\n") } : String(e)
  } finally {
    console.error = origError
  }

  results.captured_logs = capturedLogs

  return NextResponse.json(results)
}
