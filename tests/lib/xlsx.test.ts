import { describe, it, expect } from 'vitest'
import { buildXlsx } from '@/lib/xlsx'

describe('xlsx utilities', () => {
  describe('buildXlsx', () => {
    it('should create a valid XLSX file with single sheet', () => {
      const sheets = [{
        name: 'Sheet1',
        rows: [
          ['Name', 'Email', 'Tickets'],
          ['Max Mustermann', 'max@example.com', '2']
        ]
      }]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)

      // Check for ZIP file signature (PK)
      expect(result[0]).toBe(0x50) // P
      expect(result[1]).toBe(0x4B) // K
      expect(result[2]).toBe(0x03) // Local file header
      expect(result[3]).toBe(0x04)
    })

    it('should create XLSX with multiple sheets', () => {
      const sheets = [
        {
          name: 'Reservations',
          rows: [['Name', 'Tickets'], ['Max', '2']]
        },
        {
          name: 'Summary',
          rows: [['Total', '10']]
        }
      ]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)

      // Convert to string to check content
      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      // Should contain references to both sheets
      expect(content).toContain('sheet1.xml')
      expect(content).toContain('sheet2.xml')
    })

    it('should handle empty sheets', () => {
      const sheets = [{
        name: 'Empty',
        rows: []
      }]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle single cell', () => {
      const sheets = [{
        name: 'Single',
        rows: [['Hello']]
      }]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      const decoder = new TextDecoder()
      const content = decoder.decode(result)
      expect(content).toContain('Hello')
    })

    it('should properly escape XML special characters', () => {
      const sheets = [{
        name: 'Special',
        rows: [
          ['Name & Title'],
          ['<script>alert("XSS")</script>'],
          ['Quote "test"'],
          ['Greater > Less <']
        ]
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      // Check that special characters are escaped
      expect(content).toContain('&amp;')
      expect(content).toContain('&lt;')
      expect(content).toContain('&gt;')
      expect(content).toContain('&quot;')

      // Should not contain unescaped characters in dangerous contexts
      expect(content).not.toMatch(/<script>/i)
    })

    it('should handle unicode characters', () => {
      const sheets = [{
        name: 'Unicode',
        rows: [
          ['German: äöüß'],
          ['French: éàù'],
          ['Chinese: 你好'],
          ['Emoji: 🎭']
        ]
      }]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      expect(content).toContain('äöüß')
      expect(content).toContain('éàù')
      expect(content).toContain('你好')
    })

    it('should handle wide tables (many columns)', () => {
      const headers = Array.from({ length: 30 }, (_, i) => `Column${i + 1}`)
      const values = Array.from({ length: 30 }, (_, i) => `Value${i + 1}`)

      const sheets = [{
        name: 'Wide',
        rows: [headers, values]
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      // Column 1 is A, Column 26 is Z, Column 27 is AA, etc.
      expect(content).toContain('r="A1"')
      expect(content).toContain('r="Z1"')
      expect(content).toContain('r="AA1"')
    })

    it('should handle tall tables (many rows)', () => {
      const rows = Array.from({ length: 100 }, (_, i) => [`Row${i + 1}`])

      const sheets = [{
        name: 'Tall',
        rows
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      expect(content).toContain('r="A1"')
      expect(content).toContain('r="A100"')
    })

    it('should handle sheet names with special characters', () => {
      const sheets = [{
        name: 'Test & Data',
        rows: [['Value']]
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      // Sheet name should be XML-escaped in workbook.xml
      expect(content).toContain('Test &amp; Data')
    })

    it('should handle empty string cells', () => {
      const sheets = [{
        name: 'Empty Cells',
        rows: [
          ['A', '', 'C'],
          ['', 'B', ''],
          ['', '', '']
        ]
      }]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle very long cell content', () => {
      const longText = 'A'.repeat(10000)
      const sheets = [{
        name: 'Long',
        rows: [[longText]]
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      expect(content).toContain('A'.repeat(100)) // At least partial content
    })

    it('should create proper ZIP structure', () => {
      const sheets = [{
        name: 'Test',
        rows: [['Data']]
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      // Check for required XLSX files in the archive
      expect(content).toContain('[Content_Types].xml')
      expect(content).toContain('_rels/.rels')
      expect(content).toContain('xl/workbook.xml')
      expect(content).toContain('xl/_rels/workbook.xml.rels')
      expect(content).toContain('xl/worksheets/sheet1.xml')
    })

    it('should handle numeric strings', () => {
      const sheets = [{
        name: 'Numbers',
        rows: [
          ['Count', 'Total'],
          ['123', '456.78'],
          ['-100', '0']
        ]
      }]

      const result = buildXlsx(sheets)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      expect(content).toContain('123')
      expect(content).toContain('456.78')
      expect(content).toContain('-100')
    })

    it('should handle typical reservation export scenario', () => {
      const sheets = [{
        name: 'Reservierungen 15.01.2024',
        rows: [
          ['Name', 'E-Mail', 'Tickets', 'Erstellt am'],
          ['Max Mustermann', 'max@example.com', '2', '14.01.2024 10:30 Uhr'],
          ['Anna Schmidt', 'anna@example.com', '4', '14.01.2024 11:00 Uhr'],
          ['', '', '', ''],
          ['Gesamt', '', '6', '']
        ]
      }]

      const result = buildXlsx(sheets)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)

      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      expect(content).toContain('Max Mustermann')
      expect(content).toContain('anna@example.com')
    })
  })

  describe('column naming', () => {
    it('should correctly name columns A-Z for first 26 columns', () => {
      const headers = Array.from({ length: 26 }, (_, i) => `Col${i + 1}`)
      const sheets = [{
        name: 'Test',
        rows: [headers]
      }]

      const result = buildXlsx(sheets)
      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      // Check that all single-letter columns are present
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
        expect(content).toContain(`r="${letter}1"`)
      })
    })

    it('should correctly name columns AA, AB, etc. for columns beyond Z', () => {
      const headers = Array.from({ length: 28 }, (_, i) => `Col${i + 1}`)
      const sheets = [{
        name: 'Test',
        rows: [headers]
      }]

      const result = buildXlsx(sheets)
      const decoder = new TextDecoder()
      const content = decoder.decode(result)

      expect(content).toContain('r="AA1"')
      expect(content).toContain('r="AB1"')
    })
  })
})
