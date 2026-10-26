import { render, screen, within } from '@testing-library/react'
import { ANATHAYM } from '../engine/testFixtures.ts'
import { newCharacter, type Character } from '../state/character.ts'
import { saveToStorage } from '../state/persistence.ts'
import App from './App.tsx'

export const problemTexts = () =>
  [...(screen.queryByText('To complete this step:')?.parentElement?.querySelectorAll('li') ?? [])].map((li) => li.textContent)

export const openStep = (name: RegExp) => within(screen.getByRole('navigation')).getByRole('button', { name })

/** Anathaym with Concept, Characteristics and Attributes complete. */
export function firstThreeSteps(): Character {
  const c = newCharacter()
  return {
    ...c,
    concept: { ...c.concept, name: 'Anathaym', age: 20, method: 'pointsBuild' },
    characteristics: { rolled: null, values: { ...ANATHAYM, CHA: 4 } },
    attributes: { frame: 'lithe', heightCm: 163, weightKg: 48 },
  }
}

export function renderWith(character: Character) {
  saveToStorage(character)
  render(<App />)
}
