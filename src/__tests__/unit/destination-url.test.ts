import { describe, it, expect, beforeEach } from 'vitest'
import { slugify, storeDestinationContext, getDestinationContext } from '@/lib/destination-url'
import type { DestinationPageContext } from '@/lib/destination-url'

const mockContext: DestinationPageContext = {
  tripInput: {
    dates: { flexible: true },
    travelers: 2,
    interests: ['Hiking'],
    budgetLevel: 'moderate',
    tripStyle: 'cultural',
    locationPreference: { type: 'open' },
  },
  summary: { name: 'Lisbon', country: 'Portugal' },
}

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('New York')).toBe('new-york')
  })

  it('lowercases a single word', () => {
    expect(slugify('Barcelona')).toBe('barcelona')
  })

  it('removes special characters', () => {
    expect(slugify('São Paulo')).toBe('so-paulo')
  })

  it('collapses multiple spaces into one hyphen', () => {
    expect(slugify('New  York')).toBe('new-york')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify(' test ')).toBe('test')
  })

  it('handles already-slugified input unchanged', () => {
    expect(slugify('new-york')).toBe('new-york')
  })
})

describe('storeDestinationContext / getDestinationContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns null for an unknown slug', () => {
    expect(getDestinationContext('unknown-slug')).toBeNull()
  })

  it('stores and retrieves context by slug', () => {
    storeDestinationContext('lisbon', mockContext)
    const result = getDestinationContext('lisbon')
    expect(result?.summary.name).toBe('Lisbon')
    expect(result?.tripInput.travelers).toBe(2)
  })

  it('returns null after sessionStorage is cleared', () => {
    storeDestinationContext('lisbon', mockContext)
    sessionStorage.clear()
    expect(getDestinationContext('lisbon')).toBeNull()
  })

  it('stores different slugs independently', () => {
    storeDestinationContext('lisbon', mockContext)
    storeDestinationContext('porto', { ...mockContext, summary: { name: 'Porto' } })
    expect(getDestinationContext('lisbon')?.summary.name).toBe('Lisbon')
    expect(getDestinationContext('porto')?.summary.name).toBe('Porto')
  })

  it('overwrites an existing entry for the same slug', () => {
    storeDestinationContext('lisbon', mockContext)
    storeDestinationContext('lisbon', { ...mockContext, summary: { name: 'Lisbon Updated' } })
    expect(getDestinationContext('lisbon')?.summary.name).toBe('Lisbon Updated')
  })
})
