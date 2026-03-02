import { describe, it, expect } from 'vitest'
import {
  convertFromEur,
  getCurrencySymbol,
  formatPrice,
  isValidCurrency,
  SUPPORTED_CURRENCIES,
} from '@/lib/currency'

describe('convertFromEur', () => {
  it('returns same amount for EUR (rate = 1)', () => {
    expect(convertFromEur(100, 'EUR')).toBe(100)
  })

  it('converts EUR to USD using the hardcoded rate', () => {
    expect(convertFromEur(100, 'USD')).toBe(108)
  })

  it('converts EUR to JPY (large multiplier)', () => {
    expect(convertFromEur(10, 'JPY')).toBe(1620)
  })

  it('rounds fractional results', () => {
    expect(convertFromEur(5, 'CHF')).toBe(5)
  })
})

describe('getCurrencySymbol', () => {
  it('returns € for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })

  it('returns £ for GBP', () => {
    expect(getCurrencySymbol('GBP')).toBe('£')
  })

  it('returns CHF for CHF (symbol equals code)', () => {
    expect(getCurrencySymbol('CHF')).toBe('CHF')
  })
})

describe('formatPrice', () => {
  it('returns empty string for null', () => {
    expect(formatPrice(null, 'EUR')).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatPrice(undefined, 'EUR')).toBe('')
  })

  it('formats EUR amount with € symbol', () => {
    expect(formatPrice(100, 'EUR')).toBe('€100')
  })

  it('formats USD amount with $ symbol and converted value', () => {
    expect(formatPrice(100, 'USD')).toBe('$108')
  })

  it('includes thousands separator for large amounts', () => {
    const result = formatPrice(1000, 'JPY')
    expect(result).toMatch(/^¥/)
    expect(result).toMatch(/162/)
    expect(result.replace(/[,.\s\u00A0]/g, '')).toBe('¥162000')
  })
})

describe('isValidCurrency', () => {
  it('returns true for valid currency codes', () => {
    for (const { code } of SUPPORTED_CURRENCIES) {
      expect(isValidCurrency(code)).toBe(true)
    }
  })

  it('returns false for unknown currency code', () => {
    expect(isValidCurrency('XYZ')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidCurrency('')).toBe(false)
  })
})
