// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

import { GET, POST } from '@/app/api/showcase/route'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/showcase', () => {
  it('returns 200 with an array', async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { name: 'Lisbon', country: 'Portugal', slug: 'lisbon-portugal', imageUrl: '/api/destination-image?name=Lisbon', destinationData: { name: 'Lisbon', country: 'Portugal' } },
          ]),
        }),
      }),
    })
    const req = new NextRequest('http://localhost/api/showcase')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json[0].name).toBe('Lisbon')
  })

  it('returns empty array when table is empty', async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })
    const req = new NextRequest('http://localhost/api/showcase')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })
})

describe('POST /api/showcase', () => {
  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'lisbon-portugal' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when slug is missing', async () => {
    const req = new NextRequest('http://localhost/api/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lisbon' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and upserts on valid payload', async () => {
    dbMock.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    })
    const req = new NextRequest('http://localhost/api/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lisbon',
        country: 'Portugal',
        slug: 'lisbon-portugal',
        imageUrl: '/api/destination-image?name=Lisbon&country=Portugal',
        destinationData: { name: 'Lisbon', country: 'Portugal' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
