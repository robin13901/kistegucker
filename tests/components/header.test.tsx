import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../test-utils'
import { Header } from '@/components/header'

// Mock usePathname for different test scenarios
const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => new URLSearchParams(),
}))

describe('Header', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  describe('rendering', () => {
    it('should render the organization name', () => {
      render(<Header />)

      expect(screen.getByText('Die Kistegucker e.V.')).toBeInTheDocument()
    })

    it('should render all navigation links', () => {
      render(<Header />)

      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('Theaterstücke')).toBeInTheDocument()
      expect(screen.getByText('Mitglieder')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should link to correct pages', () => {
      render(<Header />)

      expect(screen.getByText('Start').closest('a')).toHaveAttribute('href', '/')
      expect(screen.getByText('Theaterstücke').closest('a')).toHaveAttribute('href', '/events')
      expect(screen.getByText('Mitglieder').closest('a')).toHaveAttribute('href', '/mitglieder')
      expect(screen.getByText('Admin').closest('a')).toHaveAttribute('href', '/admin')
    })

    it('should link organization name to home', () => {
      render(<Header />)

      const logo = screen.getByText('Die Kistegucker e.V.')
      expect(logo.closest('a')).toHaveAttribute('href', '/')
    })

    it('should have sticky header styling', () => {
      render(<Header />)

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky', 'top-0')
    })
  })

  describe('active state', () => {
    it('should highlight Start link when on home page', () => {
      mockUsePathname.mockReturnValue('/')
      render(<Header />)

      const startLink = screen.getByText('Start')
      expect(startLink).toHaveClass('text-accent')
    })

    it('should highlight Theaterstücke link when on /events', () => {
      mockUsePathname.mockReturnValue('/events')
      render(<Header />)

      const eventsLink = screen.getByText('Theaterstücke')
      expect(eventsLink).toHaveClass('text-accent')

      const startLink = screen.getByText('Start')
      expect(startLink).not.toHaveClass('text-accent')
    })

    it('should highlight Theaterstücke link when on /events subpage', () => {
      mockUsePathname.mockReturnValue('/events/some-play')
      render(<Header />)

      const eventsLink = screen.getByText('Theaterstücke')
      expect(eventsLink).toHaveClass('text-accent')
    })

    it('should highlight Mitglieder link when on /mitglieder', () => {
      mockUsePathname.mockReturnValue('/mitglieder')
      render(<Header />)

      const membersLink = screen.getByText('Mitglieder')
      expect(membersLink).toHaveClass('text-accent')
    })

    it('should highlight Admin link when on /admin', () => {
      mockUsePathname.mockReturnValue('/admin')
      render(<Header />)

      const adminLink = screen.getByText('Admin')
      expect(adminLink).toHaveClass('text-accent')
    })

    it('should not highlight Start on subpages', () => {
      mockUsePathname.mockReturnValue('/events')
      render(<Header />)

      const startLink = screen.getByText('Start')
      expect(startLink).not.toHaveClass('text-accent')
    })

    it('should highlight correct link for nested admin routes', () => {
      mockUsePathname.mockReturnValue('/admin/settings')
      render(<Header />)

      const adminLink = screen.getByText('Admin')
      expect(adminLink).toHaveClass('text-accent')

      const startLink = screen.getByText('Start')
      expect(startLink).not.toHaveClass('text-accent')
    })
  })

  describe('accessibility', () => {
    it('should have navigation landmark', () => {
      render(<Header />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have banner landmark', () => {
      render(<Header />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('should have proper link elements', () => {
      render(<Header />)

      const links = screen.getAllByRole('link')
      // Logo link + 4 nav links
      expect(links.length).toBeGreaterThanOrEqual(5)
    })
  })
})
