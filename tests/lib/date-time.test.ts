import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDateTime, isPastEvent } from '@/lib/date-time'

describe('date-time utilities', () => {
  describe('formatDateTime', () => {
    it('should format date without time', () => {
      expect(formatDateTime('2024-01-15')).toBe('15.01.2024')
      expect(formatDateTime('2024-12-31')).toBe('31.12.2024')
    })

    it('should format date with time', () => {
      expect(formatDateTime('2024-01-15', '14:30:00')).toBe('15.01.2024 14:30 Uhr')
      expect(formatDateTime('2024-06-20', '09:00:00')).toBe('20.06.2024 09:00 Uhr')
    })

    it('should extract HH:MM from full time string', () => {
      expect(formatDateTime('2024-01-15', '14:30:59')).toBe('15.01.2024 14:30 Uhr')
    })

    it('should handle already short time format', () => {
      expect(formatDateTime('2024-01-15', '14:30')).toBe('15.01.2024 14:30 Uhr')
    })

    it('should handle edge cases for date parsing', () => {
      // Invalid date format - falls back to showing raw value
      expect(formatDateTime('invalid-date')).toBe('invalid-date')
      expect(formatDateTime('invalid-date', '14:30')).toBe('invalid-date 14:30 Uhr')
    })

    it('should handle empty date parts gracefully', () => {
      expect(formatDateTime('2024-01')).toBe('2024-01')
      expect(formatDateTime('2024')).toBe('2024')
    })

    it('should handle midnight time', () => {
      expect(formatDateTime('2024-01-15', '00:00:00')).toBe('15.01.2024 00:00 Uhr')
    })

    it('should handle end of day time', () => {
      expect(formatDateTime('2024-01-15', '23:59:59')).toBe('15.01.2024 23:59 Uhr')
    })
  })

  describe('isPastEvent', () => {
    const realDateNow = Date.now

    beforeEach(() => {
      // Mock Date.now to return a fixed timestamp
      // January 15, 2024 12:00:00 UTC
      vi.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-15T12:00:00Z').getTime())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should return true for past dates', () => {
      expect(isPastEvent('2024-01-14')).toBe(true)
      expect(isPastEvent('2024-01-10')).toBe(true)
      expect(isPastEvent('2023-12-31')).toBe(true)
    })

    it('should return false for future dates', () => {
      expect(isPastEvent('2024-01-16')).toBe(false)
      expect(isPastEvent('2024-02-01')).toBe(false)
      expect(isPastEvent('2025-01-01')).toBe(false)
    })

    it('should return true for past date with past time', () => {
      expect(isPastEvent('2024-01-15', '10:00:00')).toBe(true)
      expect(isPastEvent('2024-01-15', '11:59:59')).toBe(true)
    })

    it('should return false for today with future time', () => {
      expect(isPastEvent('2024-01-15', '13:00:00')).toBe(false)
      expect(isPastEvent('2024-01-15', '23:59:59')).toBe(false)
    })

    it('should use 23:59:59 as default time when time not provided', () => {
      // Same day should not be past if using 23:59:59
      expect(isPastEvent('2024-01-15')).toBe(false)
    })

    it('should return false for invalid date', () => {
      expect(isPastEvent('invalid-date')).toBe(false)
      expect(isPastEvent('')).toBe(false)
      expect(isPastEvent('not-a-date', '14:30')).toBe(false)
    })

    it('should handle edge case of exactly current time', () => {
      // At 12:00:00, 12:00:00 should be considered past (< not <=)
      vi.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-15T12:00:00.001Z').getTime())
      expect(isPastEvent('2024-01-15', '12:00:00')).toBe(true)
    })

    it('should handle different years correctly', () => {
      expect(isPastEvent('2020-06-15')).toBe(true)
      expect(isPastEvent('2030-06-15')).toBe(false)
    })
  })
})
