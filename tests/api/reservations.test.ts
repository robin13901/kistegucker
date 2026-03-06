import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/reservations/route'
import { NextResponse } from 'next/server'

// Mock Supabase client
const mockRpc = vi.fn()
const mockInsert = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
}

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup chain mocks
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  describe('validation', () => {
    it('should reject invalid payload - missing name', async () => {
      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should reject invalid email', async () => {
      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'invalid',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ungültige E-Mail-Adresse')
    })

    it('should reject too many tickets', async () => {
      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 5,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Maximal 4 Tickets pro Reservierung')
    })

    it('should reject short name', async () => {
      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'A',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name ist zu kurz')
    })
  })

  describe('Supabase not configured', () => {
    it('should return 500 when Supabase is not configured', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase')
      vi.mocked(getSupabaseClient).mockReturnValueOnce(null)

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Supabase ist nicht konfiguriert.')
    })
  })

  describe('performance lookup', () => {
    it('should return 404 when performance not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'nonexistent'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Aufführung wurde nicht gefunden.')
    })

    it('should query performance by eventId', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: true })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return { insert: mockInsert.mockResolvedValueOnce({ error: null }) }
        }
        return { select: mockSelect }
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      await POST(request)

      expect(mockFrom).toHaveBeenCalledWith('performances')
      expect(mockSelect).toHaveBeenCalledWith('start_datetime')
      expect(mockEq).toHaveBeenCalledWith('id', 'event-123')
    })
  })

  describe('past event check', () => {
    it('should reject reservations for past performances', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() - 86400000).toISOString() },
        error: null
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Für vergangene Aufführungen sind keine Online-Reservierungen möglich.')
    })
  })

  describe('ticket availability', () => {
    it('should return error when not enough tickets available', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: false })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Für diese Aufführung sind online nicht mehr genug Tickets verfügbar.')
    })

    it('should call increment_reserved_tickets RPC', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: true })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return { insert: mockInsert.mockResolvedValueOnce({ error: null }) }
        }
        return { select: mockSelect }
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 3,
          eventId: 'event-123'
        }),
      })

      await POST(request)

      expect(mockRpc).toHaveBeenCalledWith('increment_reserved_tickets', {
        performance_id_input: 'event-123',
        ticket_amount: 3
      })
    })
  })

  describe('reservation insertion', () => {
    it('should insert reservation with correct data', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: true })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return { insert: mockInsert.mockResolvedValueOnce({ error: null }) }
        }
        return { select: mockSelect }
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Max Mustermann',
        email: 'max@example.com',
        tickets: 2,
        performance_id: 'event-123'
      })
      expect(response.status).toBe(200)
    })

    it('should rollback on insert error', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: true }) // increment succeeds
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return { insert: mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } }) }
        }
        return { select: mockSelect }
      })
      mockRpc.mockResolvedValueOnce({ data: true }) // decrement for rollback

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Datenbankfehler beim Speichern.')
      expect(mockRpc).toHaveBeenCalledTimes(2)
      expect(mockRpc).toHaveBeenLastCalledWith('decrement_reserved_tickets', {
        performance_id_input: 'event-123',
        ticket_amount: 2
      })
    })
  })

  describe('successful reservation', () => {
    it('should return success message', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: true })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return { insert: mockInsert.mockResolvedValueOnce({ error: null }) }
        }
        return { select: mockSelect }
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('Reservierung gespeichert')
    })

    it('should revalidate public paths', async () => {
      const { revalidatePath, revalidateTag } = await import('next/cache')

      mockSingle.mockResolvedValueOnce({
        data: { start_datetime: new Date(Date.now() + 86400000).toISOString() },
        error: null
      })
      mockRpc.mockResolvedValueOnce({ data: true })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'reservations') {
          return { insert: mockInsert.mockResolvedValueOnce({ error: null }) }
        }
        return { select: mockSelect }
      })

      const request = new Request('http://localhost/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }),
      })

      await POST(request)

      expect(revalidateTag).toHaveBeenCalledWith('public-plays')
      expect(revalidatePath).toHaveBeenCalledWith('/')
      expect(revalidatePath).toHaveBeenCalledWith('/events')
      expect(revalidatePath).toHaveBeenCalledWith('/tickets')
    })
  })
})
