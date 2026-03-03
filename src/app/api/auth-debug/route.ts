import { NextResponse, NextRequest } from "next/server"
import { Auth, skipCSRFCheck, raw } from "@auth/core"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

// Test the POST signin flow directly (bypassing CSRF like the Server Action does)
export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {}
  const capturedLogs: unknown[] = []

  const origError = console.error
  console.error = (...args: unknown[]) => {
    capturedLogs.push(args.map(a =>
      a instanceof Error
        ? { name: a.name, message: a.message, stack: a.stack?.split("\n").slice(0, 6).join("\n") }
        : typeof a === "object" ? JSON.stringify(a) : String(a)
    ))
    origError(...args)
  }

  try {
    const config = {
      secret: process.env.AUTH_SECRET!,
      trustHost: true,
      basePath: "/api/auth",
      providers: [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID!,
          clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
      ],
    }

    // POST to signin/google as the server-side signIn() does
    const body = new URLSearchParams({ callbackUrl: "/explore" })
    const signinReq = new Request(
      "https://rough-idea-travel.vercel.app/api/auth/signin/google",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    )

    const res = await Auth(signinReq, { ...config, [raw]: true, [skipCSRFCheck]: skipCSRFCheck } as Parameters<typeof Auth>[1])
    const internalRes = res as { cookies?: Array<{name: string, value: string}>, redirect?: string }
    results.signin_redirect = internalRes.redirect
    results.signin_cookies = internalRes.cookies?.map((c: {name: string, value: string}) => ({ name: c.name, hasValue: !!c.value }))
  } catch (e: unknown) {
    results.signin_error = e instanceof Error
      ? { name: e.name, message: e.message, stack: e.stack?.split("\n").slice(0, 8).join("\n") }
      : String(e)
  } finally {
    console.error = origError
  }

  results.captured_logs = capturedLogs
  return NextResponse.json(results)
}
