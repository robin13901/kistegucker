import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { ReservationForm } from '@/components/reservation-form'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ReservationForm', () => {
  const defaultProps = {
    eventId: 'event-123',
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('rendering', () => {
    it('should render form with all fields', () => {
      render(<ReservationForm {...defaultProps} />)

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument()
      expect(screen.getByLabelText('Anzahl Tickets')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reservierung absenden' })).toBeInTheDocument()
    })

    it('should have hidden eventId field', () => {
      const { container } = render(<ReservationForm {...defaultProps} />)

      const hiddenInput = container.querySelector('input[name="eventId"]')
      expect(hiddenInput).toHaveAttribute('value', 'event-123')
      expect(hiddenInput).toHaveAttribute('type', 'hidden')
    })

    it('should show max tickets hint', () => {
      render(<ReservationForm {...defaultProps} maxTickets={4} />)

      expect(screen.getByText('Maximal 4 Tickets pro Reservierung')).toBeInTheDocument()
    })

    it('should show privacy policy link', () => {
      render(<ReservationForm {...defaultProps} />)

      const link = screen.getByText('Datenschutzerklärung')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/datenschutz')
    })

    it('should set default ticket value to 1', () => {
      render(<ReservationForm {...defaultProps} />)

      const ticketInput = screen.getByLabelText('Anzahl Tickets')
      expect(ticketInput).toHaveValue(1)
    })

    it('should set max tickets attribute', () => {
      render(<ReservationForm {...defaultProps} maxTickets={6} />)

      const ticketInput = screen.getByLabelText('Anzahl Tickets')
      expect(ticketInput).toHaveAttribute('max', '6')
    })
  })

  describe('disabled state', () => {
    it('should show disabled message when disabled', () => {
      render(<ReservationForm {...defaultProps} disabled />)

      expect(screen.getByText('Reservierung nicht möglich')).toBeInTheDocument()
      expect(screen.getByText(/ausgebucht/)).toBeInTheDocument()
    })

    it('should not show form when disabled', () => {
      render(<ReservationForm {...defaultProps} disabled />)

      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reservierung absenden' })).not.toBeInTheDocument()
    })

    it('should show link to other events when disabled', () => {
      render(<ReservationForm {...defaultProps} disabled />)

      const link = screen.getByText('Andere Termine ansehen →')
      expect(link.closest('a')).toHaveAttribute('href', '/events')
    })
  })

  describe('form submission', () => {
    it('should submit form with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max Mustermann')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.clear(screen.getByLabelText('Anzahl Tickets'))
      await user.type(screen.getByLabelText('Anzahl Tickets'), '2')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Max Mustermann',
            email: 'max@example.com',
            tickets: 2,
            eventId: 'event-123'
          })
        })
      })
    })

    it('should show loading state during submission', async () => {
      let resolvePromise: (value: unknown) => void
      const submissionPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(submissionPromise)

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      expect(screen.getByRole('button', { name: 'Wird gesendet...' })).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()

      resolvePromise!({ ok: true, json: () => Promise.resolve({}) })
    })

    it('should disable inputs during submission', async () => {
      let resolvePromise: (value: unknown) => void
      const submissionPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(submissionPromise)

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      expect(screen.getByLabelText('Name')).toBeDisabled()
      expect(screen.getByLabelText('E-Mail')).toBeDisabled()
      expect(screen.getByLabelText('Anzahl Tickets')).toBeDisabled()

      resolvePromise!({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  describe('success state', () => {
    it('should show success message after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max Mustermann')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        expect(screen.getByText('Reservierung erfolgreich!')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText(/Deine Reservierung wurde gespeichert/)).toBeInTheDocument()
      expect(screen.getByText(/Du erhältst eine Bestätigungs-E-Mail/)).toBeInTheDocument()
    })

    it('should not show form after success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('error state', () => {
    it('should show error message on failed submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email address' })
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show default error message when no error provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        expect(screen.getByText('Reservierung fehlgeschlagen')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should keep form visible after error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Error' })
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reservierung absenden' })).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('should require name field', () => {
      render(<ReservationForm {...defaultProps} />)

      const nameInput = screen.getByLabelText('Name')
      expect(nameInput).toBeRequired()
    })

    it('should require email field', () => {
      render(<ReservationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('E-Mail')
      expect(emailInput).toBeRequired()
    })

    it('should have email type on email field', () => {
      render(<ReservationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('E-Mail')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should require tickets field', () => {
      render(<ReservationForm {...defaultProps} />)

      const ticketsInput = screen.getByLabelText('Anzahl Tickets')
      expect(ticketsInput).toBeRequired()
    })

    it('should have min 1 on tickets field', () => {
      render(<ReservationForm {...defaultProps} />)

      const ticketsInput = screen.getByLabelText('Anzahl Tickets')
      expect(ticketsInput).toHaveAttribute('min', '1')
    })
  })

  describe('styling', () => {
    it('should have card styling on form', () => {
      render(<ReservationForm {...defaultProps} />)

      const form = document.querySelector('form')
      expect(form).toHaveClass('rounded-2xl', 'bg-white', 'shadow-card')
    })

    it('should have green background on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const user = userEvent.setup()
      render(<ReservationForm {...defaultProps} />)

      await user.type(screen.getByLabelText('Name'), 'Max')
      await user.type(screen.getByLabelText('E-Mail'), 'max@example.com')
      await user.click(screen.getByRole('button', { name: 'Reservierung absenden' }))

      await waitFor(() => {
        const successDiv = screen.getByText('Reservierung erfolgreich!').closest('div')
        expect(successDiv).toHaveClass('bg-green-50')
      }, { timeout: 3000 })
    })
  })
})
