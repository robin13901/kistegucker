import { describe, it, expect } from 'vitest'
import { reservationSchema, ReservationInput } from '@/lib/validation'

describe('validation schemas', () => {
  describe('reservationSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid reservation data', () => {
        const validData = {
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it('should accept minimum valid ticket count (1)', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 1,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept maximum valid ticket count (4)', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 4,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should coerce string tickets to number', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: '2',
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.tickets).toBe(2)
          expect(typeof result.data.tickets).toBe('number')
        }
      })

      it('should accept name with exactly 2 characters', () => {
        const data = {
          name: 'AB',
          email: 'ab@example.com',
          tickets: 1,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept various valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'test.name@example.com',
          'test+tag@example.com',
          'test@subdomain.example.com',
          'test@example.co.uk'
        ]

        validEmails.forEach((email) => {
          const data = {
            name: 'Test User',
            email,
            tickets: 1,
            eventId: 'event-123'
          }
          const result = reservationSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should accept long eventId strings', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 1,
          eventId: 'a'.repeat(100)
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('invalid inputs', () => {
      it('should reject name that is too short', () => {
        const data = {
          name: 'A',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Name ist zu kurz')
        }
      })

      it('should reject empty name', () => {
        const data = {
          name: '',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject invalid email format', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'test@',
          'test@.com',
          'test',
          ''
        ]

        invalidEmails.forEach((email) => {
          const data = {
            name: 'Max Mustermann',
            email,
            tickets: 2,
            eventId: 'event-123'
          }
          const result = reservationSchema.safeParse(data)
          expect(result.success).toBe(false)
          if (!result.success && email !== '') {
            expect(result.error.issues[0].message).toBe('Ungültige E-Mail-Adresse')
          }
        })
      })

      it('should reject ticket count less than 1', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 0,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject negative ticket count', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: -1,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject ticket count greater than 4', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 5,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Maximal 4 Tickets pro Reservierung')
        }
      })

      it('should reject large ticket counts', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 100,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject empty eventId', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 2,
          eventId: ''
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing fields', () => {
        const incompleteData = [
          { email: 'max@example.com', tickets: 2, eventId: 'event-123' },
          { name: 'Max', tickets: 2, eventId: 'event-123' },
          { name: 'Max', email: 'max@example.com', eventId: 'event-123' },
          { name: 'Max', email: 'max@example.com', tickets: 2 }
        ]

        incompleteData.forEach((data) => {
          const result = reservationSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it('should reject non-numeric ticket values that cannot be coerced', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 'abc',
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        // 'abc' coerces to NaN, which fails the min(1) check
        expect(result.success).toBe(false)
      })
    })

    describe('type inference', () => {
      it('should have correct type structure', () => {
        const validData: ReservationInput = {
          name: 'Max Mustermann',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should handle whitespace in name', () => {
        const data = {
          name: '  Max  ',
          email: 'max@example.com',
          tickets: 2,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        // Whitespace counts towards length, so this should pass
        expect(result.success).toBe(true)
      })

      it('should handle unicode characters in name', () => {
        const data = {
          name: 'Müller Öztürk',
          email: 'test@example.com',
          tickets: 2,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should handle float ticket numbers', () => {
        const data = {
          name: 'Max',
          email: 'max@example.com',
          tickets: 2.7,
          eventId: 'event-123'
        }

        const result = reservationSchema.safeParse(data)
        // coerce.number() will handle the float
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.tickets).toBe(2.7)
        }
      })
    })
  })
})
