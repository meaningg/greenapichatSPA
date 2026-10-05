import { describe, expect, it } from 'vitest'
import { formatPhone, isValidPhone, normalizePhone, phoneToChatId } from './phone'

describe('normalizePhone', () => {
  it('убирает форматирование и знак плюс', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
  })

  it('преобразует ведущую 8 в 7', () => {
    expect(normalizePhone('8 999 123-45-67')).toBe('79991234567')
  })

  it('не трогает номера, не начинающиеся с 8', () => {
    expect(normalizePhone('79991234567')).toBe('79991234567')
  })

  it('возвращает пустую строку, если цифр нет', () => {
    expect(normalizePhone('нет цифр')).toBe('')
  })
})

describe('phoneToChatId', () => {
  it('добавляет суффикс @c.us', () => {
    expect(phoneToChatId('79991234567')).toBe('79991234567@c.us')
  })
})

describe('isValidPhone', () => {
  it('принимает номер в разных форматах', () => {
    expect(isValidPhone('79991234567')).toBe(true)
    expect(isValidPhone('+7 999 123-45-67')).toBe(true)
  })

  it('отклоняет слишком короткие и пустые значения', () => {
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('abcdef')).toBe(false)
  })
})

describe('formatPhone', () => {
  it('форматирует российский номер', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })

  it('добавляет плюс к прочим номерам', () => {
    expect(formatPhone('4915112345678')).toBe('+4915112345678')
  })

  it('возвращает пустую строку для пустого ввода', () => {
    expect(formatPhone('')).toBe('')
  })
})
