import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import { PlayCard } from '@/components/play-card'

const createFutureDate = () => new Date(Date.now() + 86400000).toISOString()
const createPastDate = () => new Date(Date.now() - 86400000).toISOString()

describe('PlayCard', () => {
  const defaultProps = {
    title: 'Hamlet',
    description: 'A tragic tale of a Danish prince',
    performances: [],
    mode: 'upcoming' as const,
  }

  describe('rendering basics', () => {
    it('should render title', () => {
      render(<PlayCard {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Hamlet' })).toBeInTheDocument()
    })

    it('should render description', () => {
      render(<PlayCard {...defaultProps} />)

      expect(screen.getByText('A tragic tale of a Danish prince')).toBeInTheDocument()
    })

    it('should render poster image when provided', () => {
      render(<PlayCard {...defaultProps} posterImage="https://example.com/poster.jpg" />)

      const img = screen.getByRole('img', { name: 'Hamlet' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', expect.stringContaining('poster.jpg'))
    })

    it('should not render image when posterImage is null', () => {
      render(<PlayCard {...defaultProps} posterImage={null} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('should render as article element', () => {
      render(<PlayCard {...defaultProps} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  describe('upcoming mode', () => {
    it('should filter to show only upcoming performances', () => {
      const performances = [
        { id: '1', start_datetime: createFutureDate(), is_past: false },
        { id: '2', start_datetime: createPastDate(), is_past: true },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="upcoming" />)

      // Should show future performance date but not past
      const reserveLinks = screen.getAllByText(/Tickets reservieren/)
      expect(reserveLinks).toHaveLength(1)
    })

    it('should show ticket availability', () => {
      const performances = [
        {
          id: '1',
          start_datetime: createFutureDate(),
          is_past: false,
          reserved_online_tickets: 10,
          online_quota: 50
        },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="upcoming" />)

      expect(screen.getByText('10/50')).toBeInTheDocument()
    })

    it('should show 0/0 when availability not provided', () => {
      const performances = [
        { id: '1', start_datetime: createFutureDate(), is_past: false },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="upcoming" />)

      expect(screen.getByText('0/0')).toBeInTheDocument()
    })

    it('should show reservation link for each performance', () => {
      const performances = [
        { id: 'perf-123', start_datetime: createFutureDate(), is_past: false },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="upcoming" />)

      const link = screen.getByText('Tickets reservieren →')
      expect(link.closest('a')).toHaveAttribute('href', '/tickets?performance=perf-123')
    })

    it('should not show reservation link when showReservationLink is false', () => {
      const performances = [
        { id: 'perf-123', start_datetime: createFutureDate(), is_past: false },
      ]

      render(
        <PlayCard
          {...defaultProps}
          performances={performances}
          mode="upcoming"
          showReservationLink={false}
        />
      )

      expect(screen.queryByText('Tickets reservieren →')).not.toBeInTheDocument()
    })
  })

  describe('past mode', () => {
    it('should filter to show only past performances', () => {
      const performances = [
        { id: '1', start_datetime: createFutureDate(), is_past: false },
        { id: '2', start_datetime: '2023-01-15T19:00:00', is_past: true },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="past" />)

      // Should show formatted past date
      expect(screen.getByText('15.01.2023')).toBeInTheDocument()
      // Should not show reservation links in past mode
      expect(screen.queryByText(/Tickets reservieren/)).not.toBeInTheDocument()
    })

    it('should show dash when no past performances', () => {
      const performances = [
        { id: '1', start_datetime: createFutureDate(), is_past: false },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="past" />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should join multiple past dates with separator', () => {
      const performances = [
        { id: '1', start_datetime: '2023-01-15T19:00:00', is_past: true },
        { id: '2', start_datetime: '2023-01-16T19:00:00', is_past: true },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="past" />)

      expect(screen.getByText('15.01.2023 · 16.01.2023')).toBeInTheDocument()
    })
  })

  describe('details link', () => {
    it('should show details link when slug is provided', () => {
      render(<PlayCard {...defaultProps} slug="hamlet" />)

      const link = screen.getByText('Details →')
      expect(link.closest('a')).toHaveAttribute('href', '/events/hamlet')
    })

    it('should not show details link when slug is not provided', () => {
      render(<PlayCard {...defaultProps} />)

      expect(screen.queryByText('Details →')).not.toBeInTheDocument()
    })

    it('should not show details link when showDetailsLink is false', () => {
      render(<PlayCard {...defaultProps} slug="hamlet" showDetailsLink={false} />)

      expect(screen.queryByText('Details →')).not.toBeInTheDocument()
    })

    it('should have different styling in past mode', () => {
      render(<PlayCard {...defaultProps} slug="hamlet" mode="past" />)

      const link = screen.getByText('Details →')
      expect(link).toHaveClass('mt-4', 'text-sm')
    })

    it('should have different styling in upcoming mode', () => {
      render(<PlayCard {...defaultProps} slug="hamlet" mode="upcoming" />)

      const link = screen.getByText('Details →')
      expect(link).toHaveClass('mt-3')
    })
  })

  describe('actions', () => {
    it('should render actions when provided', () => {
      const actions = <button>Edit</button>

      render(<PlayCard {...defaultProps} actions={actions} />)

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })

    it('should not render actions slot when not provided', () => {
      render(<PlayCard {...defaultProps} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('date formatting', () => {
    it('should format performance dates in German format', () => {
      const performances = [
        { id: '1', start_datetime: '2024-12-25T19:00:00', is_past: false },
      ]

      render(<PlayCard {...defaultProps} performances={performances} mode="upcoming" />)

      expect(screen.getByText('25.12.2024')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have card styling classes', () => {
      render(<PlayCard {...defaultProps} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('rounded-2xl', 'border', 'shadow-card')
    })
  })
})
