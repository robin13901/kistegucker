import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import { MemberCard } from '@/components/member-card'

describe('MemberCard', () => {
  const defaultProps = {
    name: 'Max Mustermann',
    description: 'Ein talentierter Schauspieler',
    clubRoles: ['Schauspieler'],
  }

  describe('rendering basics', () => {
    it('should render name', () => {
      render(<MemberCard {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Max Mustermann' })).toBeInTheDocument()
    })

    it('should render description', () => {
      render(<MemberCard {...defaultProps} />)

      expect(screen.getByText('Ein talentierter Schauspieler')).toBeInTheDocument()
    })

    it('should render as article element', () => {
      render(<MemberCard {...defaultProps} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should set id on article when provided', () => {
      render(<MemberCard {...defaultProps} id="member-123" />)

      expect(screen.getByRole('article')).toHaveAttribute('id', 'member-123')
    })
  })

  describe('image handling', () => {
    it('should render image when imageUrl is provided', () => {
      render(<MemberCard {...defaultProps} imageUrl="https://example.com/max.jpg" />)

      const img = screen.getByRole('img', { name: 'Max Mustermann' })
      expect(img).toBeInTheDocument()
    })

    it('should render placeholder when imageUrl is null', () => {
      render(<MemberCard {...defaultProps} imageUrl={null} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      // Placeholder div should exist
      const article = screen.getByRole('article')
      expect(article.querySelector('.bg-zinc-100')).toBeInTheDocument()
    })

    it('should render placeholder when imageUrl is not provided', () => {
      render(<MemberCard {...defaultProps} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('club roles', () => {
    it('should render single role', () => {
      render(<MemberCard {...defaultProps} clubRoles={['Schauspieler']} />)

      expect(screen.getByText('Schauspieler')).toBeInTheDocument()
    })

    it('should format two roles with "und"', () => {
      render(<MemberCard {...defaultProps} clubRoles={['Schauspieler', 'Regisseur']} />)

      expect(screen.getByText('Schauspieler und Regisseur')).toBeInTheDocument()
    })

    it('should format three or more roles with commas and "&"', () => {
      render(<MemberCard {...defaultProps} clubRoles={['Schauspieler', 'Regisseur', 'Autor']} />)

      expect(screen.getByText('Schauspieler, Regisseur & Autor')).toBeInTheDocument()
    })

    it('should handle empty roles array', () => {
      render(<MemberCard {...defaultProps} clubRoles={[]} />)

      // Should render empty text element but not crash
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should have accent color for roles', () => {
      render(<MemberCard {...defaultProps} clubRoles={['Schauspieler']} />)

      const rolesText = screen.getByText('Schauspieler')
      expect(rolesText).toHaveClass('text-accent')
    })
  })

  describe('participations', () => {
    it('should not render participations section when empty', () => {
      render(<MemberCard {...defaultProps} participations={[]} />)

      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('should render participations when provided', () => {
      const participations = [
        { piece: 'Hamlet', role: 'Hamlet' },
        { piece: 'Macbeth', role: 'Macbeth' },
      ]

      render(<MemberCard {...defaultProps} participations={participations} />)

      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('should format participations correctly', () => {
      const participations = [
        { piece: 'Hamlet', role: 'Der Prinz' },
      ]

      render(<MemberCard {...defaultProps} participations={participations} />)

      expect(screen.getByText('• Hamlet: Der Prinz')).toBeInTheDocument()
    })

    it('should render multiple participations', () => {
      const participations = [
        { piece: 'Hamlet', role: 'Hamlet' },
        { piece: 'Macbeth', role: 'Macduff' },
        { piece: 'Othello', role: 'Iago' },
      ]

      render(<MemberCard {...defaultProps} participations={participations} />)

      expect(screen.getByText('• Hamlet: Hamlet')).toBeInTheDocument()
      expect(screen.getByText('• Macbeth: Macduff')).toBeInTheDocument()
      expect(screen.getByText('• Othello: Iago')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should render actions when provided', () => {
      const actions = <button>Bearbeiten</button>

      render(<MemberCard {...defaultProps} actions={actions} />)

      expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument()
    })

    it('should not render actions slot when not provided', () => {
      render(<MemberCard {...defaultProps} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have card styling classes', () => {
      render(<MemberCard {...defaultProps} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('rounded-2xl', 'bg-white', 'shadow-card')
    })

    it('should have hover animation class', () => {
      render(<MemberCard {...defaultProps} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('hover:-translate-y-1')
    })

    it('should have transition class', () => {
      render(<MemberCard {...defaultProps} />)

      const article = screen.getByRole('article')
      expect(article).toHaveClass('transition')
    })
  })

  describe('edge cases', () => {
    it('should handle very long description', () => {
      const longDescription = 'A'.repeat(500)
      render(<MemberCard {...defaultProps} description={longDescription} />)

      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('should handle special characters in name', () => {
      render(<MemberCard {...defaultProps} name="Müller-Öztürk, Hans-Peter" />)

      expect(screen.getByRole('heading', { name: 'Müller-Öztürk, Hans-Peter' })).toBeInTheDocument()
    })

    it('should handle special characters in roles', () => {
      render(<MemberCard {...defaultProps} clubRoles={['1. Vorsitzender', '2. Kassenwart']} />)

      expect(screen.getByText('1. Vorsitzender und 2. Kassenwart')).toBeInTheDocument()
    })
  })
})
