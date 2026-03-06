import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PUT, DELETE } from '@/app/api/admin/members/route'

// Mock Supabase
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockFrom = vi.fn()

const mockSupabase = {
  from: mockFrom,
}

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ supabase: mockSupabase })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('Admin Members API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/members', () => {
    it('should return members list', async () => {
      const mockMembers = [
        { id: '1', name: 'Max', description: 'Actor', club_roles: [] }
      ]

      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: mockMembers, error: null })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockMembers)
      expect(mockFrom).toHaveBeenCalledWith('members')
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return 500 when admin not configured', async () => {
      const { requireAdmin } = await import('@/lib/admin-auth')
      vi.mocked(requireAdmin).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Supabase ist nicht konfiguriert.')
    })

    it('should return 400 on database error', async () => {
      mockFrom.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ order: mockOrder })
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('DB Error')
    })
  })

  describe('POST /api/admin/members', () => {
    it('should create new member', async () => {
      const newMember = { id: '1', name: 'Max', description: 'Actor', club_roles: [], image_url: null }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: newMember, error: null })

      const request = new Request('http://localhost/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Max', description: 'Actor', club_roles: [] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(newMember)
    })

    it('should validate required name', async () => {
      const request = new Request('http://localhost/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', description: 'Actor' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.fieldErrors.name).toBe('Bitte einen Namen eingeben.')
    })

    it('should validate required description', async () => {
      const request = new Request('http://localhost/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Max', description: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.fieldErrors.description).toBe('Bitte eine Beschreibung eingeben.')
    })

    it('should trim whitespace from fields', async () => {
      const newMember = { id: '1', name: 'Max', description: 'Actor', club_roles: [], image_url: null }

      mockFrom.mockReturnValue({ insert: mockInsert })
      mockInsert.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: newMember, error: null })

      const request = new Request('http://localhost/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '  Max  ', description: '  Actor  ', club_roles: ['  Role  '] }),
      })

      await POST(request)

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Max',
        description: 'Actor',
        club_roles: ['Role'],
        image_url: null
      })
    })
  })

  describe('PUT /api/admin/members', () => {
    it('should update existing member', async () => {
      const updatedMember = { id: '1', name: 'Max Updated', description: 'Director', club_roles: [] }

      mockFrom.mockReturnValue({ update: mockUpdate })
      mockUpdate.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockSingle.mockResolvedValue({ data: updatedMember, error: null })

      const request = new Request('http://localhost/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', name: 'Max Updated', description: 'Director' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(updatedMember)
    })

    it('should require member ID', async () => {
      const request = new Request('http://localhost/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Max', description: 'Actor' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Mitglieds-ID fehlt')
    })

    it('should validate fields on update', async () => {
      const request = new Request('http://localhost/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', name: '', description: '' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.fieldErrors).toBeDefined()
    })
  })

  describe('DELETE /api/admin/members', () => {
    it('should delete member by ID', async () => {
      mockFrom.mockReturnValue({ delete: mockDelete })
      mockDelete.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: null })

      const request = new Request('http://localhost/api/admin/members?id=123', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockEq).toHaveBeenCalledWith('id', '123')
    })

    it('should require member ID', async () => {
      const request = new Request('http://localhost/api/admin/members', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Mitglieds-ID fehlt')
    })

    it('should return error on database error', async () => {
      mockFrom.mockReturnValue({ delete: mockDelete })
      mockDelete.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: { message: 'Foreign key constraint' } })

      const request = new Request('http://localhost/api/admin/members?id=123', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Foreign key constraint')
    })

    it('should revalidate paths after deletion', async () => {
      const { revalidatePath, revalidateTag } = await import('next/cache')

      mockFrom.mockReturnValue({ delete: mockDelete })
      mockDelete.mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: null })

      const request = new Request('http://localhost/api/admin/members?id=123', {
        method: 'DELETE',
      })

      await DELETE(request)

      expect(revalidateTag).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalled()
    })
  })
})
