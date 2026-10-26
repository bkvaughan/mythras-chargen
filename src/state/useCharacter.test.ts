import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { newCharacter } from './character.ts'
import { loadFromStorage, saveToStorage } from './persistence.ts'
import { useCharacter } from './useCharacter.ts'

beforeEach(() => localStorage.clear())

test('starts a new character when nothing is saved', () => {
  const { result } = renderHook(() => useCharacter())
  expect(result.current.character).toEqual(newCharacter())
  expect(result.current.derived.steps.concept.complete).toBe(false)
})

test('restores the saved character and autosaves changes', () => {
  saveToStorage({ ...newCharacter(), concept: { ...newCharacter().concept, name: 'Kara' } })
  const { result } = renderHook(() => useCharacter())
  expect(result.current.character.concept.name).toBe('Kara')

  act(() => result.current.dispatch({ type: 'setConcept', changes: { name: 'Xenos' } }))
  expect(loadFromStorage()?.concept.name).toBe('Xenos')
})

test('a character saved before a default existed gets it on load', () => {
  // Saved before culture skills started at the minimum: only Endurance was filled in.
  const c = newCharacter()
  saveToStorage({
    ...c,
    culture: { culture: 'barbarian', standardChoice: [], professional: [], combatStyle: null, points: { Endurance: 10 }, passions: [], nativeTongue: '' },
  })
  const { result } = renderHook(() => useCharacter())
  expect(result.current.character.culture?.points).toEqual({
    Athletics: 5,
    Brawn: 5,
    Endurance: 10,
    'First Aid': 5,
    Locale: 5,
    Perception: 5,
  })
})
