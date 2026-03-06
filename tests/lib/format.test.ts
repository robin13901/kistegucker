import { describe, it, expect } from 'vitest'
import { toHourMinute, formatRoles, slugify, formatDate, formatDateTime } from '@/lib/format'

describe('format utilities', () => {
  describe('toHourMinute', () => {
    it('should extract HH:MM from a time string', () => {
      expect(toHourMinute('14:30:00')).toBe('14:30')
      expect(toHourMinute('09:05:59')).toBe('09:05')
      expect(toHourMinute('23:59:00')).toBe('23:59')
    })

    it('should handle ISO timestamp format', () => {
      expect(toHourMinute('2024-01-15T14:30:00')).toBe('2024-')
    })

    it('should return empty string for empty input', () => {
      expect(toHourMinute('')).toBe('')
    })

    it('should handle short time strings', () => {
      expect(toHourMinute('14:30')).toBe('14:30')
      expect(toHourMinute('9:30')).toBe('9:30')
    })

    it('should handle malformed input gracefully', () => {
      expect(toHourMinute('abc')).toBe('abc')
      expect(toHourMinute('12')).toBe('12')
    })
  })

  describe('formatRoles', () => {
    it('should return empty string for empty array', () => {
      expect(formatRoles([])).toBe('')
    })

    it('should return single role as-is', () => {
      expect(formatRoles(['Schauspieler'])).toBe('Schauspieler')
    })

    it('should join two roles with "und"', () => {
      expect(formatRoles(['Schauspieler', 'Regisseur'])).toBe('Schauspieler und Regisseur')
    })

    it('should join three or more roles with commas and "&"', () => {
      expect(formatRoles(['Schauspieler', 'Regisseur', 'Autor'])).toBe('Schauspieler, Regisseur & Autor')
      expect(formatRoles(['A', 'B', 'C', 'D'])).toBe('A, B, C & D')
    })

    it('should trim whitespace from roles', () => {
      expect(formatRoles(['  Schauspieler  ', '  Regisseur  '])).toBe('Schauspieler und Regisseur')
    })

    it('should filter out empty roles', () => {
      expect(formatRoles(['Schauspieler', '', 'Regisseur'])).toBe('Schauspieler und Regisseur')
      expect(formatRoles(['', '  ', 'Schauspieler'])).toBe('Schauspieler')
    })

    it('should handle array with only empty strings', () => {
      expect(formatRoles(['', '  ', ''])).toBe('')
    })

    it('should handle array with undefined-like values after filtering', () => {
      expect(formatRoles(['  '])).toBe('')
    })
  })

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('UPPERCASE')).toBe('uppercase')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('hello world test')).toBe('hello-world-test')
    })

    it('should handle German umlauts', () => {
      expect(slugify('Über')).toBe('ueber')
      expect(slugify('Öffentlich')).toBe('oeffentlich')
      expect(slugify('Grün')).toBe('gruen')
      expect(slugify('Straße')).toBe('strasse')
    })

    it('should replace multiple special characters with single hyphen', () => {
      expect(slugify('hello---world')).toBe('hello-world')
      expect(slugify('hello   world')).toBe('hello-world')
      expect(slugify('hello!@#world')).toBe('hello-world')
    })

    it('should remove leading and trailing hyphens', () => {
      expect(slugify('---hello---')).toBe('hello')
      expect(slugify('  hello  ')).toBe('hello')
    })

    it('should handle complex theater play names', () => {
      expect(slugify('Die große Übung')).toBe('die-grosse-uebung')
      expect(slugify('Fünf Freunde & das Ding')).toBe('fuenf-freunde-das-ding')
    })

    it('should handle numbers', () => {
      expect(slugify('Hello 123 World')).toBe('hello-123-world')
      expect(slugify('42')).toBe('42')
    })

    it('should handle empty string', () => {
      expect(slugify('')).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format ISO date to DD.MM.YYYY', () => {
      expect(formatDate('2024-01-15')).toBe('15.01.2024')
      expect(formatDate('2024-12-31')).toBe('31.12.2024')
    })

    it('should format ISO datetime to DD.MM.YYYY', () => {
      expect(formatDate('2024-01-15T14:30:00')).toBe('15.01.2024')
      expect(formatDate('2024-01-15T14:30:00Z')).toBe('15.01.2024')
    })

    it('should pad single-digit days and months', () => {
      expect(formatDate('2024-01-05')).toBe('05.01.2024')
      expect(formatDate('2024-09-01')).toBe('01.09.2024')
    })

    it('should handle different years', () => {
      expect(formatDate('2020-06-15')).toBe('15.06.2020')
      expect(formatDate('2030-03-20')).toBe('20.03.2030')
    })
  })

  describe('formatDateTime', () => {
    it('should format ISO datetime to German format with "Uhr"', () => {
      const result = formatDateTime('2024-01-15T14:30:00')
      expect(result).toContain('15.01.2024')
      expect(result).toContain('14:30')
      expect(result).toContain('Uhr')
    })

    it('should format datetime with Z suffix', () => {
      const result = formatDateTime('2024-01-15T14:30:00Z')
      expect(result).toContain('Uhr')
    })

    it('should handle midnight', () => {
      const result = formatDateTime('2024-01-15T00:00:00')
      expect(result).toContain('00:00')
      expect(result).toContain('Uhr')
    })

    it('should handle end of day time', () => {
      const result = formatDateTime('2024-01-15T23:59:00')
      expect(result).toContain('23:59')
      expect(result).toContain('Uhr')
    })
  })
})
