// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockToTextStreamResponse, mockStreamText, mockAuth, mockCookies } = vi.hoisted(() => {
  const mockToTextStreamResponse = vi.fn().mockReturnValue(new Response('stream'))
  const mockStreamText = vi.fn().mockReturnValue({
    toTextStreamResponse: mockToTextStreamResponse,
  })
  const mockAuth = vi.fn().mockResolvedValue({ user: { id: 'test-user' } })
  const mockCookieStore = {
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
  }
  const mockCookies = vi.fn().mockResolvedValue(mockCookieStore)
  return { mockToTextStreamResponse, mockStreamText, mockAuth, mockCookies }
})

vi.mock('ai', () => ({
  streamText: mockStreamText,
  Output: {
    object: vi.fn().mockReturnValue({}),
  },
}))

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn().mockReturnValue(vi.fn()),
}))

vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

vi.mock('next/headers', () => ({ cookies: mockCookies }))

import { POST } from '@/app/api/explore/route'

const validBody = {
  dates: { flexible: true },
  travelers: 2,
  interests: ['Hiking'],
  budgetLevel: 'moderate',
  tripStyle: 'cultural',
  locationPreference: { type: 'open' },
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/explore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/explore', () => {
  let originalApiKey: string | undefined

  beforeEach(() => {
    originalApiKey = process.env.ROUGH_IDEA_ANTHROPIC_API_KEY
    vi.clearAllMocks()
    mockStreamText.mockReturnValue({ toTextStreamResponse: mockToTextStreamResponse })
    mockToTextStreamResponse.mockReturnValue(new Response('stream'))
    process.env.ROUGH_IDEA_ANTHROPIC_API_KEY = 'test-key'
  })

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ROUGH_IDEA_ANTHROPIC_API_KEY
    } else {
      process.env.ROUGH_IDEA_ANTHROPIC_API_KEY = originalApiKey
    }
  })

  it('returns 500 when ROUGH_IDEA_ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ROUGH_IDEA_ANTHROPIC_API_KEY
    const response = await POST(makeRequest(validBody))
    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toMatch(/not configured/i)
  })

  it('calls streamText and returns its streaming response for a standard trip', async () => {
    const response = await POST(makeRequest(validBody))
    expect(mockStreamText).toHaveBeenCalledOnce()
    expect(response.status).toBe(200)
  })

  it('uses standard token limit (8192) for non-road-trip inputs', async () => {
    await POST(makeRequest(validBody))
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 8192 })
    )
  })

  it('uses extended token limit (12288) for road trip inputs', async () => {
    const roadTripBody = { ...validBody, tripStyle: 'road_trip' }
    await POST(makeRequest(roadTripBody))
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 12288 })
    )
  })

  it('uses extended token limit (12288) when travelRange is driving_distance', async () => {
    const roadTripBody = { ...validBody, travelRange: 'driving_distance' }
    await POST(makeRequest(roadTripBody))
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 12288 })
    )
  })

  it('returns 500 for invalid request body', async () => {
    const response = await POST(makeRequest({ travelers: 'not-a-number' }))
    expect(response.status).toBe(500)
  })
})
