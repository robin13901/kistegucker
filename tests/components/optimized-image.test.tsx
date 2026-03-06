import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { OptimizedImage } from '@/components/optimized-image'

describe('OptimizedImage', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    width: 800,
    height: 600,
  }

  describe('rendering', () => {
    it('should render image with correct attributes', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img', { name: 'Test image' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', 'Test image')
    })

    it('should apply className to image', () => {
      render(<OptimizedImage {...defaultProps} className="custom-class" />)

      const img = screen.getByRole('img')
      expect(img).toHaveClass('custom-class')
    })

    it('should pass width and height', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '800')
      expect(img).toHaveAttribute('height', '600')
    })
  })

  describe('loading state', () => {
    it('should show loading placeholder initially', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      // Check for the loading placeholder div
      const placeholder = container.querySelector('.animate-pulse')
      expect(placeholder).toBeInTheDocument()
    })

    it('should have opacity-0 on image when loading', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveClass('opacity-0')
    })

    it('should show opacity-100 after image loads', async () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')

      // Simulate image load
      fireEvent.load(img)

      await waitFor(() => {
        expect(img).toHaveClass('opacity-100')
      })
    })

    it('should hide placeholder after image loads', async () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      fireEvent.load(img)

      await waitFor(() => {
        const placeholder = container.querySelector('.animate-pulse')
        expect(placeholder).not.toBeInTheDocument()
      })
    })
  })

  describe('transition', () => {
    it('should have transition classes', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveClass('transition-opacity', 'duration-300')
    })
  })

  describe('priority', () => {
    it('should default priority to false', () => {
      render(<OptimizedImage {...defaultProps} />)

      // Priority is passed to Next Image but doesn't appear as an attribute
      // We just verify the component renders
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('should accept priority prop', () => {
      render(<OptimizedImage {...defaultProps} priority />)

      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('should pass sizes prop', () => {
      render(<OptimizedImage {...defaultProps} sizes="(max-width: 768px) 100vw, 50vw" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
    })
  })

  describe('wrapper', () => {
    it('should wrap image in relative container', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('relative', 'overflow-hidden')
    })
  })

  describe('placeholder styling', () => {
    it('should have correct aspect ratio on placeholder', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      const placeholder = container.querySelector('.animate-pulse')
      expect(placeholder).toHaveStyle({ aspectRatio: '800/600' })
    })

    it('should apply className to placeholder', () => {
      const { container } = render(<OptimizedImage {...defaultProps} className="h-52" />)

      const placeholder = container.querySelector('.animate-pulse')
      expect(placeholder).toHaveClass('h-52')
    })
  })

  describe('edge cases', () => {
    it('should handle different aspect ratios', () => {
      const { container } = render(
        <OptimizedImage {...defaultProps} width={1920} height={1080} />
      )

      const placeholder = container.querySelector('.animate-pulse')
      expect(placeholder).toHaveStyle({ aspectRatio: '1920/1080' })
    })

    it('should handle empty className', () => {
      render(<OptimizedImage {...defaultProps} className="" />)

      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })
})
