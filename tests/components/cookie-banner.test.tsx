import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { CookieBanner } from '@/components/cookie-banner'

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial visibility', () => {
    it('should show banner when no consent in localStorage', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByText(/technisch notwendige Cookies/)).toBeInTheDocument()
      })
    })

    it('should not show banner when consent already given', async () => {
      localStorage.setItem('kistegucker-cookie-consent', 'accepted')

      render(<CookieBanner />)

      // Wait for useEffect to run
      await waitFor(() => {
        expect(screen.queryByText(/technisch notwendige Cookies/)).not.toBeInTheDocument()
      })
    })
  })

  describe('content', () => {
    it('should display cookie information text', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByText(/technisch notwendige Cookies/)).toBeInTheDocument()
      })
    })

    it('should mention no tracking cookies', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByText(/Tracking- oder Marketing-Cookies/)).toBeInTheDocument()
      })
    })

    it('should have understand button', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Verstanden' })).toBeInTheDocument()
      })
    })
  })

  describe('user interaction', () => {
    it('should hide banner when button clicked', async () => {
      const user = userEvent.setup()
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Verstanden' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Verstanden' }))

      await waitFor(() => {
        expect(screen.queryByText(/technisch notwendige Cookies/)).not.toBeInTheDocument()
      })
    })

    it('should set localStorage when button clicked', async () => {
      const user = userEvent.setup()
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Verstanden' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Verstanden' }))

      expect(localStorage.getItem('kistegucker-cookie-consent')).toBe('accepted')
    })
  })

  describe('styling', () => {
    it('should be fixed positioned', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        const banner = screen.getByText(/technisch notwendige Cookies/).closest('div')
        expect(banner).toHaveClass('fixed')
      })
    })

    it('should be at bottom of screen', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        const banner = screen.getByText(/technisch notwendige Cookies/).closest('div')
        expect(banner).toHaveClass('bottom-4')
      })
    })

    it('should have dark background', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        const banner = screen.getByText(/technisch notwendige Cookies/).closest('div')
        expect(banner).toHaveClass('bg-zinc-900')
      })
    })

    it('should have high z-index', async () => {
      render(<CookieBanner />)

      await waitFor(() => {
        const banner = screen.getByText(/technisch notwendige Cookies/).closest('div')
        expect(banner).toHaveClass('z-50')
      })
    })
  })

  describe('persistence', () => {
    it('should not show banner on subsequent renders after consent', async () => {
      const user = userEvent.setup()

      // First render - accept consent
      const { unmount } = render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Verstanden' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Verstanden' }))
      unmount()

      // Second render - should not show
      render(<CookieBanner />)

      await waitFor(() => {
        expect(screen.queryByText(/technisch notwendige Cookies/)).not.toBeInTheDocument()
      })
    })
  })
})
