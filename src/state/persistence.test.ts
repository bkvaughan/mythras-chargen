import { describe, expect, test } from 'vitest'
import { ANATHAYM, ANATHAYM_CULTURE } from '../engine/testFixtures.ts'
import { newCharacter, type Character } from './character.ts'
import { loadFromStorage, parseCharacter, saveToStorage, toJson } from './persistence.ts'

const character: Character = {
  ...newCharacter(),
  concept: { ...newCharacter().concept, name: 'Anathaym', age: 20, method: 'pointsBuild' },
  characteristics: { rolled: null, values: ANATHAYM },
  culture: { ...ANATHAYM_CULTURE, nativeTongue: 'Meerish' },
}

describe('export and import', () => {
  test('export then import gives an identical character', () => {
    expect(parseCharacter(toJson(character))).toEqual({ ok: true, character })
    expect(parseCharacter(toJson(newCharacter()))).toEqual({ ok: true, character: newCharacter() })
  })

  test('a file that is not JSON', () => {
    expect(parseCharacter('{ not json')).toEqual({ ok: false, error: 'This file is not valid JSON.' })
  })

  test('a JSON file that is not a character names the problem fields', () => {
    const result = parseCharacter(JSON.stringify({ ...character, culture: { ...character.culture, culture: 'elven' } }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^This is not a valid character file:/)
      expect(result.error).toContain('culture.culture')
    }
  })

  test('a file from another schema version is rejected', () => {
    const result = parseCharacter(JSON.stringify({ ...character, schemaVersion: 99 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('schemaVersion')
  })
})

describe('autosave', () => {
  test('saves and restores the character', () => {
    saveToStorage(character, localStorage)
    expect(loadFromStorage(localStorage)).toEqual(character)
  })

  test('nothing saved, or a broken save, restores nothing', () => {
    localStorage.clear()
    expect(loadFromStorage(localStorage)).toBeNull()
    localStorage.setItem('mythras-chargen:character', '{"schemaVersion":1}')
    expect(loadFromStorage(localStorage)).toBeNull()
  })
})
