import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, DELETE } from '@/app/api/admin/reservations/route'

// Mock Supabase
const mockSelect = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
}

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ supabase: mockSupabase })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('Admin Reservations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/reservations', () => {
    const mockReservations = [
      {
        id: 'res-1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        tickets: 2,
        reserved_at: '2024-01-15T10:00:00Z',
        performance: {
          id: 'perf-1',
          start_datetime: '2024-02-15T19:00:00Z',
          play: { id: 'play-1', title: 'Hamlet', slug: 'hamlet' }
        }
      }
    ]

    it('should return reservations list', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: mockReservations, error: null })

      const request = new Request('http://localhost/api/admin/reservations')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(mockFrom).toHaveBeenCalledWith('reservations')
    })

    it('should return 500 when admin not configured', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth')
      vi.mocked(requireAdmin).mockResolvedValueOnce(null)

      const request = new Request('http://localhost/api/admin/reservations')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Supabase ist nicht konfiguriert.')
    })

    it('should filter by event_id when provided', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ data: mockReservations, error: null })

      const request = new Request('http://localhost/api/admin/reservations?event_id=perf-1')

      await GET(request)

      expect(mockEq).toHaveBeenCalledWith('performance_id', 'perf-1')
    })

    it('should return 400 on database error', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

      const request = new Request('http://localhost/api/admin/reservations')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('DB Error')
    })

    it('should return XLSX when format=xlsx', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: mockReservations, error: null })

      const request = new Request('http://localhost/api/admin/reservations?format=xlsx')

      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.xlsx')
    })

    it('should return empty XLSX when no reservations', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const request = new Request('http://localhost/api/admin/reservations?format=xlsx')

      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should filter by play_id when provided', async () => {
      const reservationsWithMultiplePlays = [
        {
          id: 'res-1',
          name: 'Max',
          email: 'max@example.com',
          tickets: 2,
          reserved_at: '2024-01-15T10:00:00Z',
          performance: {
            id: 'perf-1',
            start_datetime: '2024-02-15T19:00:00Z',
            play: { id: 'play-1', title: 'Hamlet', slug: 'hamlet' }
          }
        },
        {
          id: 'res-2',
          name: 'Anna',
          email: 'anna@example.com',
          tickets: 3,
          reserved_at: '2024-01-15T11:00:00Z',
          performance: {
            id: 'perf-2',
            start_datetime: '2024-03-15T19:00:00Z',
            play: { id: 'play-2', title: 'Macbeth', slug: 'macbeth' }
          }
        }
      ]

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: reservationsWithMultiplePlays, error: null })

      const request = new Request('http://localhost/api/admin/reservations?play_id=play-1')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should only contain reservation for play-1
      expect(data.data.every((r: { play: { id: string } }) => r.play?.id === 'play-1')).toBe(true)
    })
  })

  describe('DELETE /api/admin/reservations', () => {
    it('should delete reservation by ID', async () => {
      // First call - get reservation
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { tickets: 2, performance_id: 'perf-1' },
                  error: null
                })
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {}
      })

      mockRpc.mockResolvedValue({ data: true })

      const request = new Request('http://localhost/api/admin/reservations?id=res-123', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
    })

    it('should require reservation ID', async () => {
      const request = new Request('http://localhost/api/admin/reservations', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Reservierungs-ID fehlt')
    })

    it('should return 404 when reservation not found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })

      const request = new Request('http://localhost/api/admin/reservations?id=nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Reservierung nicht gefunden')
    })

    it('should call decrement_reserved_tickets RPC on delete', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { tickets: 3, performance_id: 'perf-123' },
                  error: null
                })
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {}
      })

      mockRpc.mockResolvedValue({ data: true })

      const request = new Request('http://localhost/api/admin/reservations?id=res-123', {
        method: 'DELETE',
      })

      await DELETE(request)

      expect(mockRpc).toHaveBeenCalledWith('decrement_reserved_tickets', {
        performance_id_input: 'perf-123',
        ticket_amount: 3
      })
    })

    it('should revalidate paths after deletion', async () => {
      const { revalidatePath, revalidateTag } = await import('next/cache')

      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { tickets: 2, performance_id: 'perf-1' },
                  error: null
                })
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {}
      })

      mockRpc.mockResolvedValue({ data: true })

      const request = new Request('http://localhost/api/admin/reservations?id=res-123', {
        method: 'DELETE',
      })

      await DELETE(request)

      expect(revalidateTag).toHaveBeenCalledWith('public-plays')
      expect(revalidatePath).toHaveBeenCalled()
    })
  })
})
