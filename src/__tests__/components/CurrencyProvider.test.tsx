import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CurrencyProvider, useCurrency } from '@/components/CurrencyProvider'
import { CURRENCY_STORAGE_KEY } from '@/lib/currency'
import * as nextAuth from 'next-auth/react'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn().mockReturnValue({ data: null, status: 'unauthenticated' }),
}))

function CurrencyConsumer() {
  const { currency, setCurrency, isLoading } = useCurrency()
  return (
    <div>
      <span data-testid="currency">{currency}</span>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <button onClick={() => setCurrency('USD')}>Set USD</button>
    </div>
  )
}

describe('CurrencyProvider (unauthenticated)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(nextAuth.useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as ReturnType<typeof nextAuth.useSession>)
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to EUR and becomes ready', async () => {
    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
    expect(screen.getByTestId('currency')).toHaveTextContent('EUR')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('loads saved currency from localStorage', async () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'GBP')
    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
    expect(screen.getByTestId('currency')).toHaveTextContent('GBP')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('ignores invalid currency codes in localStorage', async () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'BOGUS')
    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
    expect(screen.getByTestId('currency')).toHaveTextContent('EUR')
  })

  it('updates currency and persists to localStorage when setCurrency is called', async () => {
    const user = userEvent.setup()
    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })
    await user.click(screen.getByRole('button', { name: /set usd/i }))
    expect(screen.getByTestId('currency')).toHaveTextContent('USD')
    expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('USD')
  })
})

describe('CurrencyProvider (authenticated)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(nextAuth.useSession).mockReturnValue({
      data: { user: { id: 'u-1', name: 'Test', email: 'test@test.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads currency from server on mount and becomes ready', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ currency: 'GBP' }), { status: 200 })
    )

    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    expect(screen.getByTestId('currency')).toHaveTextContent('GBP')
    expect(global.fetch).toHaveBeenCalledWith('/api/user/preferences')
  })

  it('falls back to EUR when server returns invalid currency', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ currency: 'INVALID' }), { status: 200 })
    )

    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    expect(screen.getByTestId('currency')).toHaveTextContent('EUR')
  })

  it('stays ready and defaults to EUR when server fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    render(
      <CurrencyProvider>
        <CurrencyConsumer />
      </CurrencyProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    expect(screen.getByTestId('currency')).toHaveTextContent('EUR')
  })
})
