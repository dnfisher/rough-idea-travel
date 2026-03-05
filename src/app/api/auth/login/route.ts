import { type NextRequest } from "next/server"
import { signIn } from "@/lib/auth"

const ALLOWED_PROVIDERS = ["google", "github"] as const;
type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("provider") ?? "google";
  const provider: AllowedProvider = ALLOWED_PROVIDERS.includes(raw as AllowedProvider)
    ? (raw as AllowedProvider)
    : "google";
  const rawCallback = req.nextUrl.searchParams.get("callbackUrl") ?? "/explore";
  const ALLOWED_CALLBACKS = ["/explore", "/", "/trip/"];
  const callbackUrl = ALLOWED_CALLBACKS.some(p => rawCallback.startsWith(p)) ? rawCallback : "/explore";
  await signIn(provider, { redirectTo: callbackUrl });
}
