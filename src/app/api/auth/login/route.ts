import { type NextRequest } from "next/server"
import { signIn } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") ?? "google"
  const raw = req.nextUrl.searchParams.get("callbackUrl") ?? "/explore"
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/explore"
  await signIn(provider, { redirectTo: callbackUrl })
}
