import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the Supabase client module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  })),
}))

describe('admin-auth utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('requireAdmin', () => {
    it('should return null when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const { requireAdmin } = await import('@/lib/admin-auth')
      const result = await requireAdmin()

      expect(result).toBeNull()
    })

    it('should return null when no keys are available', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const { requireAdmin } = await import('@/lib/admin-auth')
      const result = await requireAdmin()

      expect(result).toBeNull()
    })

    it('should use service role key when available', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

      const { createClient } = await import('@supabase/supabase-js')
      const { requireAdmin } = await import('@/lib/admin-auth')

      await requireAdmin()

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'service-role-key',
        expect.objectContaining({ auth: { persistSession: false } })
      )
    })

    it('should fall back to anon key when service role key is not available', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

      const { createClient } = await import('@supabase/supabase-js')
      const { requireAdmin } = await import('@/lib/admin-auth')

      await requireAdmin()

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'anon-key',
        expect.objectContaining({ auth: { persistSession: false } })
      )
    })

    it('should return object with supabase client when configured', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const { requireAdmin } = await import('@/lib/admin-auth')
      const result = await requireAdmin()

      expect(result).not.toBeNull()
      expect(result).toHaveProperty('supabase')
    })

    it('should configure client with persistSession: false', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

      const { createClient } = await import('@supabase/supabase-js')
      const { requireAdmin } = await import('@/lib/admin-auth')

      await requireAdmin()

      expect(createClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { auth: { persistSession: false } }
      )
    })
  })
})
