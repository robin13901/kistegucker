import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import { Footer } from '@/components/footer'

describe('Footer', () => {
  describe('rendering', () => {
    it('should render the organization name', () => {
      render(<Footer />)

      expect(screen.getByText(/Die Kistegucker e\.V\./)).toBeInTheDocument()
    })

    it('should render the location', () => {
      render(<Footer />)

      expect(screen.getByText(/Linsengericht/)).toBeInTheDocument()
    })

    it('should render Impressum link', () => {
      render(<Footer />)

      const impressumLink = screen.getByText('Impressum')
      expect(impressumLink).toBeInTheDocument()
      expect(impressumLink.closest('a')).toHaveAttribute('href', '/impressum')
    })

    it('should render Datenschutz link', () => {
      render(<Footer />)

      const datenschutzLink = screen.getByText('Datenschutz')
      expect(datenschutzLink).toBeInTheDocument()
      expect(datenschutzLink.closest('a')).toHaveAttribute('href', '/datenschutz')
    })

    it('should render current year', () => {
      const currentYear = new Date().getFullYear()
      render(<Footer />)

      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument()
    })
  })

  describe('year handling', () => {
    it('should update year automatically', () => {
      // Mock Date to test different years
      const mockDate = new Date('2025-06-15')
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date)

      render(<Footer />)

      expect(screen.getByText(/© 2025/)).toBeInTheDocument()

      vi.restoreAllMocks()
    })
  })

  describe('accessibility', () => {
    it('should have footer landmark', () => {
      render(<Footer />)

      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('should have proper link elements', () => {
      render(<Footer />)

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
    })

    it('should have hover styles on links', () => {
      render(<Footer />)

      const impressumLink = screen.getByText('Impressum')
      expect(impressumLink).toHaveClass('hover:text-accent')

      const datenschutzLink = screen.getByText('Datenschutz')
      expect(datenschutzLink).toHaveClass('hover:text-accent')
    })
  })

  describe('styling', () => {
    it('should have border top styling', () => {
      render(<Footer />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('border-t', 'border-zinc-200')
    })

    it('should have white background', () => {
      render(<Footer />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('bg-white')
    })

    it('should have margin top', () => {
      render(<Footer />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('mt-20')
    })
  })
})
