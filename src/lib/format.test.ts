import { describe, expect, it } from 'vitest'
import { formatDate, formatTime, initials, isSameDay, previewText, toMillis } from './format'

describe('toMillis', () => {
  it('переводит секунды в миллисекунды', () => {
    expect(toMillis(1_700_000_000)).toBe(1_700_000_000_000)
  })

  it('оставляет миллисекунды без изменений', () => {
    expect(toMillis(1_700_000_000_000)).toBe(1_700_000_000_000)
  })
})

describe('formatTime', () => {
  it('возвращает время в формате HH:mm', () => {
    expect(formatTime(1_700_000_000)).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('formatDate', () => {
  it('возвращает непустую человекочитаемую дату', () => {
    const result = formatDate(1_000_000_000)
    expect(result).not.toBe('')
    expect(result).toMatch(/\d{4}/)
  })
})

describe('isSameDay', () => {
  it('считает одинаковые моменты одним днём', () => {
    expect(isSameDay(1_700_000_000, 1_700_000_000)).toBe(true)
  })

  it('различает даты в разных месяцах', () => {
    const january = Date.parse('2020-01-15T12:00:00Z') / 1000
    const june = Date.parse('2020-06-15T12:00:00Z') / 1000
    expect(isSameDay(january, june)).toBe(false)
  })
})

describe('previewText', () => {
  it('схлопывает пробелы и переводы строк', () => {
    expect(previewText('  привет\n  мир  ')).toBe('привет мир')
  })

  it('обрезает длинный текст с многоточием', () => {
    expect(previewText('abcdefghij', 5)).toBe('abcd…')
  })

  it('не трогает короткий текст', () => {
    expect(previewText('ок')).toBe('ок')
  })
})

describe('initials', () => {
  it('берёт первые буквы двух слов', () => {
    expect(initials('Иван Петров')).toBe('ИП')
  })

  it('берёт две буквы одного слова', () => {
    expect(initials('Мария')).toBe('МА')
  })

  it('возвращает решётку для пустой строки', () => {
    expect(initials('   ')).toBe('#')
  })
})
