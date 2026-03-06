import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPublicPlays, getPublicMembers } from '@/lib/public-data'

// Mock the supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
}

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

describe('public-data utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPublicPlays', () => {
    beforeEach(() => {
      // Setup chain for plays: from().select().order()
      mockSupabaseClient.from.mockReturnValue({ select: mockSupabaseClient.select })
      mockSupabaseClient.select.mockReturnValue({ order: mockSupabaseClient.order })
      mockSupabaseClient.order.mockResolvedValue({ data: [], error: null })
    })
    it('should return empty array when supabase client is null', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase')
      vi.mocked(getSupabaseClient).mockReturnValueOnce(null)

      const result = await getPublicPlays()

      expect(result).toEqual([])
    })

    it('should return empty array on database error', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await getPublicPlays()

      expect(result).toEqual([])
    })

    it('should return empty array when data is null', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await getPublicPlays()

      expect(result).toEqual([])
    })

    it('should map play data correctly', async () => {
      const mockPlays = [{
        id: 'play-1',
        slug: 'test-play',
        title: 'Test Play',
        description: 'Test description',
        poster_image: 'https://example.com/poster.jpg',
        performances: [
          {
            id: 'perf-1',
            start_datetime: new Date(Date.now() + 86400000).toISOString(),
            doors_datetime: null,
            venue: 'Test Venue',
            capacity: 100,
            online_quota: 50,
            reserved_online_tickets: 10,
            gallery: []
          }
        ],
        play_cast: [
          { role: 'Hamlet', member: { id: 'member-1', name: 'Max Mustermann' } }
        ]
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('play-1')
      expect(result[0].slug).toBe('test-play')
      expect(result[0].title).toBe('Test Play')
      expect(result[0].performances).toHaveLength(1)
      expect(result[0].performances[0].is_past).toBe(false)
      expect(result[0].cast).toHaveLength(1)
      expect(result[0].cast[0].role).toBe('Hamlet')
      expect(result[0].cast[0].member_name).toBe('Max Mustermann')
    })

    it('should mark past performances correctly', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday
      const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow

      const mockPlays = [{
        id: 'play-1',
        slug: 'test',
        title: 'Test',
        description: '',
        poster_image: null,
        performances: [
          { id: 'perf-1', start_datetime: pastDate, doors_datetime: null, venue: 'V', capacity: 100, online_quota: 50, reserved_online_tickets: 0, gallery: [] },
          { id: 'perf-2', start_datetime: futureDate, doors_datetime: null, venue: 'V', capacity: 100, online_quota: 50, reserved_online_tickets: 0, gallery: [] }
        ],
        play_cast: []
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result[0].performances[0].is_past).toBe(true)
      expect(result[0].performances[1].is_past).toBe(false)
    })

    it('should sort performances by date', async () => {
      const date1 = new Date('2024-03-01').toISOString()
      const date2 = new Date('2024-01-01').toISOString()
      const date3 = new Date('2024-02-01').toISOString()

      const mockPlays = [{
        id: 'play-1',
        slug: 'test',
        title: 'Test',
        description: '',
        poster_image: null,
        performances: [
          { id: 'perf-1', start_datetime: date1, doors_datetime: null, venue: 'V', capacity: 100, online_quota: 50, reserved_online_tickets: 0, gallery: [] },
          { id: 'perf-2', start_datetime: date2, doors_datetime: null, venue: 'V', capacity: 100, online_quota: 50, reserved_online_tickets: 0, gallery: [] },
          { id: 'perf-3', start_datetime: date3, doors_datetime: null, venue: 'V', capacity: 100, online_quota: 50, reserved_online_tickets: 0, gallery: [] }
        ],
        play_cast: []
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result[0].performances[0].id).toBe('perf-2') // January
      expect(result[0].performances[1].id).toBe('perf-3') // February
      expect(result[0].performances[2].id).toBe('perf-1') // March
    })

    it('should handle array member format from Supabase', async () => {
      const mockPlays = [{
        id: 'play-1',
        slug: 'test',
        title: 'Test',
        description: '',
        poster_image: null,
        performances: [],
        play_cast: [
          { role: 'Hamlet', member: [{ id: 'member-1', name: 'Max Mustermann' }] }
        ]
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result[0].cast).toHaveLength(1)
      expect(result[0].cast[0].member_id).toBe('member-1')
      expect(result[0].cast[0].member_name).toBe('Max Mustermann')
    })

    it('should filter out cast entries without member data', async () => {
      const mockPlays = [{
        id: 'play-1',
        slug: 'test',
        title: 'Test',
        description: '',
        poster_image: null,
        performances: [],
        play_cast: [
          { role: 'Hamlet', member: { id: 'member-1', name: 'Max' } },
          { role: 'Ghost', member: null },
          { role: 'King', member: [] }
        ]
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result[0].cast).toHaveLength(1)
      expect(result[0].cast[0].role).toBe('Hamlet')
    })

    it('should handle null performances array', async () => {
      const mockPlays = [{
        id: 'play-1',
        slug: 'test',
        title: 'Test',
        description: '',
        poster_image: null,
        performances: null,
        play_cast: []
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result[0].performances).toEqual([])
    })

    it('should handle null play_cast array', async () => {
      const mockPlays = [{
        id: 'play-1',
        slug: 'test',
        title: 'Test',
        description: '',
        poster_image: null,
        performances: [],
        play_cast: null
      }]

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockPlays,
        error: null
      })

      const result = await getPublicPlays()

      expect(result[0].cast).toEqual([])
    })

    it('should query with correct parameters', async () => {
      await getPublicPlays()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('plays')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        'id,slug,title,description,poster_image,performances(*),play_cast(role,member:members(id,name))'
      )
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('getPublicMembers', () => {
    it('should return empty array when supabase client is null', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase')
      vi.mocked(getSupabaseClient).mockReturnValueOnce(null)

      const result = await getPublicMembers()

      expect(result).toEqual([])
    })

    it('should return members with participations', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          name: 'Max Mustermann',
          description: 'Actor',
          image_url: 'https://example.com/max.jpg',
          club_roles: ['Schauspieler']
        }
      ]

      const mockCastData = [
        { member_id: 'member-1', role: 'Hamlet', play: { title: 'Hamlet' } }
      ]

      // Setup for Promise.all - need to handle both parallel queries
      let callCount = 0
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCastData, error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Max Mustermann')
      expect(result[0].participations).toHaveLength(1)
      expect(result[0].participations[0].piece).toBe('Hamlet')
      expect(result[0].participations[0].role).toBe('Hamlet')
    })

    it('should handle members without participations', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          name: 'New Member',
          description: '',
          image_url: null,
          club_roles: []
        }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result[0].participations).toEqual([])
    })

    it('should handle array play format from Supabase', async () => {
      const mockMembers = [
        { id: 'member-1', name: 'Max', description: '', image_url: null, club_roles: [] }
      ]

      const mockCastData = [
        { member_id: 'member-1', role: 'Hamlet', play: [{ title: 'Hamlet' }] }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCastData, error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result[0].participations[0].piece).toBe('Hamlet')
    })

    it('should deduplicate participations', async () => {
      const mockMembers = [
        { id: 'member-1', name: 'Max', description: '', image_url: null, club_roles: [] }
      ]

      const mockCastData = [
        { member_id: 'member-1', role: 'Hamlet', play: { title: 'Hamlet' } },
        { member_id: 'member-1', role: 'Hamlet', play: { title: 'Hamlet' } } // Duplicate
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCastData, error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result[0].participations).toHaveLength(1)
    })

    it('should skip cast entries without play title', async () => {
      const mockMembers = [
        { id: 'member-1', name: 'Max', description: '', image_url: null, club_roles: [] }
      ]

      const mockCastData = [
        { member_id: 'member-1', role: 'Hamlet', play: { title: 'Hamlet' } },
        { member_id: 'member-1', role: 'Ghost', play: null },
        { member_id: 'member-1', role: 'King', play: [] }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCastData, error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result[0].participations).toHaveLength(1)
    })

    it('should skip cast entries without member_id', async () => {
      const mockMembers = [
        { id: 'member-1', name: 'Max', description: '', image_url: null, club_roles: [] }
      ]

      const mockCastData = [
        { member_id: null, role: 'Hamlet', play: { title: 'Hamlet' } },
        { member_id: 'member-1', role: 'King', play: { title: 'Hamlet' } }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockCastData, error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result[0].participations).toHaveLength(1)
      expect(result[0].participations[0].role).toBe('King')
    })

    it('should handle null cast data', async () => {
      const mockMembers = [
        { id: 'member-1', name: 'Max', description: '', image_url: null, club_roles: [] }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: null, error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result[0].participations).toEqual([])
    })

    it('should handle null members data', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          }
        }
        if (table === 'play_cast') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null })
          }
        }
        return { select: vi.fn() }
      })

      const result = await getPublicMembers()

      expect(result).toEqual([])
    })
  })
})
