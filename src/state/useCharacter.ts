import { useEffect, useMemo, useReducer } from 'react'
import { newCharacter } from './character.ts'
import { deriveCharacter } from './derive.ts'
import { loadFromStorage, saveToStorage } from './persistence.ts'
import { reducer, settle } from './reducer.ts'

/** The character in progress: restored from the browser on load and autosaved on every change. */
export function useCharacter() {
  const [character, dispatch] = useReducer(reducer, undefined, () => settle(loadFromStorage() ?? newCharacter()))
  useEffect(() => saveToStorage(character), [character])
  const derived = useMemo(() => deriveCharacter(character), [character])
  return { character, derived, dispatch }
}
