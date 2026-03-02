// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const dbMock = vi.hoisted(() => {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {}
  return new Proxy(mock, {
    get(target, prop) {
      if (!(prop in target)) target[prop as string] = vi.fn().mockReturnThis()
      return target[prop as string]
    },
  })
})
vi.mock('@/lib/db', () => ({ db: dbMock }))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}))

import { GET, PATCH } from '@/app/api/user/preferences/route'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/user/preferences', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toMatch(/unauthorized/i)
  })
})

describe('PATCH /api/user/preferences', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'USD' }),
    })
    const response = await PATCH(req)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toMatch(/unauthorized/i)
  })

  it('returns 400 for an invalid currency code', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    const req = new Request('http://localhost/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'XYZ' }),
    })
    const response = await PATCH(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/invalid currency/i)
  })
})
