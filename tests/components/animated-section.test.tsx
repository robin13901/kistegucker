import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import { AnimatedSection } from '@/components/animated-section'

describe('AnimatedSection', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <AnimatedSection>
          <p>Test content</p>
        </AnimatedSection>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <AnimatedSection>
          <p>First</p>
          <p>Second</p>
          <p>Third</p>
        </AnimatedSection>
      )

      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })

    it('should render as section element', () => {
      render(
        <AnimatedSection>
          <p>Content</p>
        </AnimatedSection>
      )

      // framer-motion is mocked to return a regular section
      const section = screen.getByText('Content').closest('section')
      expect(section).toBeInTheDocument()
    })

    it('should handle nested components', () => {
      render(
        <AnimatedSection>
          <div>
            <h2>Title</h2>
            <p>Description</p>
          </div>
        </AnimatedSection>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle text-only children', () => {
      render(<AnimatedSection>Just text</AnimatedSection>)

      expect(screen.getByText('Just text')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      const { container } = render(<AnimatedSection>{null}</AnimatedSection>)

      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })
})
