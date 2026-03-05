# Strict CSP — Nonce-Based Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `'unsafe-inline'` in `script-src` with a per-request nonce + `'strict-dynamic'` so inline scripts require a cryptographic token the attacker cannot guess.

**Architecture:** Middleware generates a nonce on every request, writes it into both the `Content-Security-Policy` response header and an `x-nonce` request header. The root layout reads `x-nonce` and stamps it onto the hand-written inline script; Next.js picks up the same header to nonce its own bootstrap scripts automatically.

**Tech Stack:** Next.js 15 App Router, NextAuth v5 (`@auth/nextjs`), Node.js `crypto` (via `crypto.randomUUID()`), Vitest for unit tests, Playwright for E2E.

---

### Task 1: Expand middleware matcher + thread nonce

The current middleware only runs on API routes. For the nonce to be present when layout.tsx renders, middleware must run on every page request too.

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Replace the file contents with this**

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_API_PREFIXES = [
  "/api/favorites",
  "/api/wishlists",
  "/api/user",
  "/api/share",
];

// Directives that do not need a per-request value.
// script-src is intentionally absent — middleware sets it with the nonce.
const STATIC_CSP_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
  "font-src 'self' https://api.fontshare.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth guard — unchanged logic, just called differently
  const isProtected = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtected) {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Nonce generation
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    ...STATIC_CSP_DIRECTIVES,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  ].join("; ");

  // Forward nonce to Server Components via request header.
  // Next.js App Router reads x-nonce automatically for its own bootstrap scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files.
    // Auth guard logic inside still only applies to PROTECTED_API_PREFIXES.
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
```

**Step 2: Verify the dev server still starts**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
npm run dev
```

Expected: Server starts on port 3000, no TypeScript errors in terminal.

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(csp): restructure middleware to generate nonce per request"
```

---

### Task 2: Remove script-src from next.config.ts

Middleware now owns `script-src`. The static config must not emit a second (weaker) CSP header.

**Files:**
- Modify: `next.config.ts`

**Step 1: Remove the `script-src` line (currently line 5)**

Delete this line:
```
  "script-src 'self' 'unsafe-inline'",
```

The resulting `ContentSecurityPolicy` array should contain only: `default-src`, `style-src`, `font-src`, `img-src`, `connect-src`, `frame-ancestors`.

This static fallback header covers `_next/static/*` assets (which bypass middleware). Those paths only serve JS files — no inline scripts — so `default-src 'self'` covers them fine.

**Step 2: Verify no TypeScript errors**

```bash
npm run build 2>&1 | head -40
```

Expected: Build completes without type errors in `next.config.ts`.

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(csp): remove script-src from static headers (middleware owns it)"
```

---

### Task 3: Read nonce in layout.tsx and stamp onto the inline script tag

`layout.tsx` is a Server Component. `headers()` from `next/headers` reads the request headers that middleware injected.

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add the headers import**

After the existing imports add:
```typescript
import { headers } from "next/headers";
```

**Step 2: Make the layout function async**

Change:
```typescript
export default function RootLayout({
```
to:
```typescript
export default async function RootLayout({
```

**Step 3: Read the nonce at the top of the function body**

Add this as the first line inside the function (before `return`):
```typescript
const nonce = (await headers()).get("x-nonce") ?? "";
```

**Step 4: Add `nonce={nonce}` prop to the existing inline `<script>` tag**

The `<script>` tag is at line 55. It already has its inner HTML set via the inline-HTML prop. Just add `nonce={nonce}` as an additional prop:
```tsx
<script
  nonce={nonce}
  {/* keep the existing inner HTML prop exactly as-is */}
/>
```

**Step 5: Verify the dev server compiles cleanly**

```bash
npm run dev
```

Open http://localhost:3000 in browser. Open DevTools → Console.
Expected: **zero** CSP violation errors. (Previously: many "Executing inline script violates CSP" errors.)

**Step 6: Verify the nonce appears in the response header**

DevTools → Network → click any page request → Response Headers. Should see:
```
content-security-policy: default-src 'self'; style-src ...; script-src 'self' 'nonce-<base64string>' 'strict-dynamic'
```

No `'unsafe-inline'` should appear in `script-src`.

**Step 7: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(csp): read x-nonce in layout and stamp onto inline script"
```

---

### Task 4: Smoke test — pills and chips are interactive

Confirms the fix didn't break hydration (the original bug that started all this).

**Step 1: Navigate to /explore**

http://localhost:3000/explore (sign in if prompted).

**Step 2: Click each pill group**

- "How far do you want to go?" → click "Nearby", "Regional", "International"
- "What kind of trip?" → click each option
- Duration chips → click "Weekend", "7 days", etc.

Expected: Each click visually selects the pill (teal highlight).

**Step 3: Check for console errors**

DevTools → Console should show zero CSP errors and zero React hydration warnings.

---

### Task 5: Run the test suite

**Step 1: Unit + integration tests**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
npm run test:run
```

Expected: All tests pass. If any fail for middleware/CSP reasons, the test fixture likely needs an `x-nonce` header added to the mock request.

**Step 2: E2E tests**

```bash
npm run test:e2e
```

Expected: All E2E tests pass, including explore form interactions.

**Step 3: Commit if you had to fix tests**

```bash
git add -A
git commit -m "fix(tests): update fixtures for nonce-based middleware"
```

(Only run this step if test files changed.)

---

### Task 6: Version bump

**Step 1: In `src/app/layout.tsx` line 77, change `v0.4.6` to `v0.4.7`**

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore: bump version to v0.4.7 (nonce-based strict CSP)"
```

---

## Verification Checklist

Before declaring done:

- [ ] `Content-Security-Policy` response header contains `'nonce-<value>' 'strict-dynamic'` and NO `'unsafe-inline'` in `script-src`
- [ ] Console shows zero CSP violation errors on any page
- [ ] All pill/chip buttons on `/explore` are clickable and update state
- [ ] Auth-protected routes still return 401 unauthenticated: `curl http://localhost:3000/api/favorites` (no session cookie) → `{"error":"Unauthorized"}`
- [ ] `npm run test:run` passes
- [ ] `npm run build` completes without errors
