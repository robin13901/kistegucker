import { vi } from 'vitest'

export const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  neq: vi.fn(() => mockSupabaseClient),
  gt: vi.fn(() => mockSupabaseClient),
  gte: vi.fn(() => mockSupabaseClient),
  lt: vi.fn(() => mockSupabaseClient),
  lte: vi.fn(() => mockSupabaseClient),
  like: vi.fn(() => mockSupabaseClient),
  ilike: vi.fn(() => mockSupabaseClient),
  is: vi.fn(() => mockSupabaseClient),
  in: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  limit: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => mockSupabaseClient),
  maybeSingle: vi.fn(() => mockSupabaseClient),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn((callback: () => void) => {
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
  },
}

export const createMockSupabaseClient = () => {
  const client = { ...mockSupabaseClient }

  // Reset all mocks
  Object.values(client).forEach((value) => {
    if (typeof value === 'function' && 'mockClear' in value) {
      (value as ReturnType<typeof vi.fn>).mockClear()
    }
  })

  return client
}

export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach((value) => {
    if (typeof value === 'function' && 'mockReset' in value) {
      (value as ReturnType<typeof vi.fn>).mockReset()
    }
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach((subValue) => {
        if (typeof subValue === 'function' && 'mockReset' in subValue) {
          (subValue as ReturnType<typeof vi.fn>).mockReset()
        }
      })
    }
  })
}

// Default mock setup for chained queries that return empty data
export const setupDefaultQueryMocks = () => {
  mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.neq.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.order.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.limit.mockReturnValue(mockSupabaseClient)
  mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })
  mockSupabaseClient.maybeSingle.mockResolvedValue({ data: null, error: null })
}
