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
  const ALLOWED_PREFIXES = ["/explore", "/trip/", "/destination/", "/favorites", "/wishlist/"];
  const normalized = new URL(rawCallback, "http://localhost").pathname;
  const callbackUrl =
    ALLOWED_PREFIXES.some(p => normalized === p || normalized.startsWith(p))
      ? normalized
      : "/explore";
  await signIn(provider, { redirectTo: callbackUrl });
}
