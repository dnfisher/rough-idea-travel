// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

const dbMock = vi.hoisted(() => {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {}
  const chainable = new Proxy(mock, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop as string] = vi.fn().mockReturnThis()
      }
      return target[prop as string]
    },
  })
  return chainable
})

vi.mock('@/lib/db', () => ({
  db: dbMock,
}))

import { GET, POST } from '@/app/api/wishlists/route'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/wishlists', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toMatch(/unauthorized/i)
  })
})

describe('POST /api/wishlists', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/wishlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Trip' }),
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toMatch(/unauthorized/i)
  })

  it('returns 400 when name is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    const req = new Request('http://localhost/api/wishlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/required/i)
  })

  it('returns 400 when name is blank whitespace', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    const req = new Request('http://localhost/api/wishlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/required/i)
  })
})
