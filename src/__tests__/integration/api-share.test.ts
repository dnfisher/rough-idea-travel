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

import { POST } from '@/app/api/share/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(null)
})

describe('POST /api/share', () => {
  it('returns 400 when destinationData is missing', async () => {
    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/missing destination/i)
  })

  it('returns 400 when destinationData.name is missing', async () => {
    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationData: { country: 'Portugal' } }),
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/missing destination/i)
  })

  it('returns 400 when destination data exceeds 50KB', async () => {
    const bigData = { name: 'Lisbon', country: 'Portugal', extra: 'x'.repeat(60_000) }
    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationData: bigData }),
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/too large/i)
  })
})
