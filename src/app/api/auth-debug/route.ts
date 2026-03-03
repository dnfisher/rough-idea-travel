import { NextResponse, NextRequest } from "next/server"
import { handlers } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {}
  const capturedLogs: unknown[] = []

  const origError = console.error
  console.error = (...args: unknown[]) => {
    capturedLogs.push(args.map(a =>
      a instanceof Error
        ? { name: a.name, message: a.message, stack: a.stack?.split("\n").slice(0, 10).join("\n") }
        : typeof a === "object" ? JSON.stringify(a) : String(a)
    ))
    origError(...args)
  }

  try {
    // Simulate a callback request with invalid params — will fail but
    // the error type tells us what goes wrong in a real callback
    const callbackUrl = new URL(
      "/api/auth/callback/google?code=fake_code&state=fake_state",
      "https://rough-idea-travel.vercel.app"
    )
    const testReq = new NextRequest(callbackUrl.toString(), {
      method: "GET",
      headers: req.headers,
    })
    const response = await handlers.GET(testReq)
    results.callback_status = response.status
    results.callback_location = response.headers.get("location")
  } catch (e: unknown) {
    results.callback_error = e instanceof Error
      ? { name: e.name, message: e.message, stack: e.stack?.split("\n").slice(0, 10).join("\n") }
      : String(e)
  } finally {
    console.error = origError
  }

  results.captured_logs = capturedLogs

  return NextResponse.json(results)
}
