import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSupabaseClient } from '@/lib/supabase'

// Mock the Supabase client module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  })),
}))

describe('supabase utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getSupabaseClient', () => {
    it('should return null when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      // Re-import after changing env
      const { getSupabaseClient } = await import('@/lib/supabase')
      const result = getSupabaseClient()

      expect(result).toBeNull()
    })

    it('should return null when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const { getSupabaseClient } = await import('@/lib/supabase')
      const result = getSupabaseClient()

      expect(result).toBeNull()
    })

    it('should return null when both env vars are not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const { getSupabaseClient } = await import('@/lib/supabase')
      const result = getSupabaseClient()

      expect(result).toBeNull()
    })

    it('should return a client when both env vars are set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      const { getSupabaseClient } = await import('@/lib/supabase')
      const result = getSupabaseClient()

      expect(result).not.toBeNull()
    })

    it('should call createClient with correct parameters', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'my-anon-key'

      const { createClient } = await import('@supabase/supabase-js')
      const { getSupabaseClient } = await import('@/lib/supabase')

      getSupabaseClient()

      expect(createClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co',
        'my-anon-key'
      )
    })
  })
})
