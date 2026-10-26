import { z } from 'zod'
import { characterSchema, type Character } from './character.ts'

const STORAGE_KEY = 'mythras-chargen:character'

export function toJson(character: Character): string {
  return JSON.stringify(character, null, 2)
}

export type ParseResult = { ok: true; character: Character } | { ok: false; error: string }

/** Validates an imported or stored character file and explains what is wrong with a bad one. */
export function parseCharacter(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }
  const result = characterSchema.safeParse(data)
  if (!result.success) {
    return { ok: false, error: `This is not a valid character file:\n${z.prettifyError(result.error)}` }
  }
  return { ok: true, character: result.data }
}

export function saveToStorage(character: Character, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, toJson(character))
}

/** The autosaved character, or null if there is none or it no longer validates. */
export function loadFromStorage(storage: Storage = localStorage): Character | null {
  const text = storage.getItem(STORAGE_KEY)
  if (text === null) return null
  const result = parseCharacter(text)
  return result.ok ? result.character : null
}

/** Offers the character as a JSON file download named after the character. */
export function downloadCharacter(character: Character): void {
  const blob = new Blob([toJson(character)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${character.concept.name.trim() || 'character'}.json`
  link.click()
  URL.revokeObjectURL(url)
}
