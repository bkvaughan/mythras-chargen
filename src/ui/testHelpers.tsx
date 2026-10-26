import { render, screen, within } from '@testing-library/react'
import { ageCategory } from '../engine/bonus.ts'
import { ANATHAYM, ANATHAYM_CAREER, ANATHAYM_CULTURE } from '../engine/testFixtures.ts'
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

/** Anathaym as rolled, through her Civilised culture, a complete background and the Warrior career. */
export function throughCareer(concept: Partial<Character['concept']> = {}): Character {
  const c = firstThreeSteps()
  return {
    ...c,
    concept: { ...c.concept, method: 'rollInOrder', ...concept },
    characteristics: { rolled: ANATHAYM, values: ANATHAYM },
    culture: { ...ANATHAYM_CULTURE, nativeTongue: '' },
    background: { ...c.background, socialClassRoll: 97, moneyRoll: 9, events: [1, 5, 9, 13].slice(0, ageCategory(concept.ageCategory ?? 'adult').backgroundEvents) },
    career: ANATHAYM_CAREER,
  }
}

export function renderWith(character: Character) {
  saveToStorage(character)
  render(<App />)
}
