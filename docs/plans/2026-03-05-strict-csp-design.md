# Strict CSP — Nonce-Based Implementation Design

**Date:** 2026-03-05
**Approach:** Nonce per request with `'strict-dynamic'` (Approach A)

## Background

The previous `script-src 'self'` CSP blocked Next.js inline bootstrap scripts, preventing React hydration entirely — clicks had no effect. Restored `'unsafe-inline'` as a hotfix. This plan replaces `'unsafe-inline'` with a proper nonce-based CSP.

## Architecture

Three files change. Middleware generates a cryptographically random nonce per request, threads it to layout via an `x-nonce` request header, and writes the full `script-src` CSP into the response. `next.config.ts` retains static headers for all other directives. `layout.tsx` reads the nonce and stamps it onto the inline script tag (the window.ethereum workaround).

## Component Changes

### `src/middleware.ts`
- Stop using `auth()` wrapper; import `NextRequest`/`NextResponse` directly
- Call `await auth(req)` inside middleware body to get session (same behavior, different structure)
- Generate nonce: `Buffer.from(crypto.randomUUID()).toString('base64')`
- Build `script-src` with `'nonce-${nonce}' 'strict-dynamic'` (no `'unsafe-inline'`)
- `request.headers.set('x-nonce', nonce)` — threads nonce to layout
- `response.headers.set('Content-Security-Policy', csp)` on every matched response

### `next.config.ts`
- Remove `script-src` from the static CSP array — middleware owns it
- Keep all other directives unchanged (`style-src`, `font-src`, `img-src`, `connect-src`, `frame-ancestors`)

### `src/app/layout.tsx`
- Make root layout function `async`
- `import { headers } from 'next/headers'`
- `const nonce = (await headers()).get('x-nonce') ?? ''`
- Add `nonce={nonce}` prop to the inline script tag

## Data Flow

```
Request arrives
  → middleware generates nonce
  → sets x-nonce on request headers
  → sets CSP response header (nonce embedded in script-src)
  → Next.js renders layout.tsx (Server Component)
      → reads x-nonce via headers()
      → stamps nonce onto inline script tag
      → Next.js propagates nonce to its own bootstrap scripts automatically
  → Browser validates: inline scripts must carry matching nonce
  → 'strict-dynamic' allows bootstrap scripts to load chunks dynamically
  → React hydrates correctly
```

## Error Handling

- **`x-nonce` absent in layout**: `?? ''` fallback — script blocked by CSP but server does not crash
- **Middleware matcher scope**: Keep existing API-route matcher; static assets bypass middleware and do not need per-request CSP
- **No `reportOnly` mode**: Replacing known-working `'unsafe-inline'`, not introducing new restrictions on unknown surface

## Files Changed

| File | Change |
|------|--------|
| `src/middleware.ts` | Restructure to manual `await auth()`, add nonce generation + CSP header |
| `next.config.ts` | Remove `script-src` from static headers |
| `src/app/layout.tsx` | Make async, read nonce, stamp onto inline script tag |
