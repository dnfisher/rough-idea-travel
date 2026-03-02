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

import { GET, POST } from '@/app/api/favorites/route'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/favorites', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/favorites')
    const response = await GET(req)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toMatch(/unauthorized/i)
  })
})

describe('POST /api/favorites', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationData: { name: 'Lisbon', country: 'Portugal' } }),
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toMatch(/unauthorized/i)
  })

  it('returns 400 when destinationData is missing entirely', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    const req = new Request('http://localhost/api/favorites', {
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
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    const req = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationData: { country: 'Portugal' } }),
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/missing destination/i)
  })
})
