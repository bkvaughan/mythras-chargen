import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { newCharacter, type Character } from '../../state/character.ts'
import { loadFromStorage, toJson } from '../../state/persistence.ts'
import { openStep, renderWith, throughCareer } from '../testHelpers.tsx'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

/** Anathaym complete: 150 bonus points spread over ten skills. */
function complete(): Character {
  const c = throughCareer()
  const skills = ['Athletics', 'Brawn', 'Endurance', 'Evade', 'Perception', 'Stealth', 'Willpower', 'Insight', 'Influence', 'Locale']
  return { ...c, bonus: { hobby: null, points: Object.fromEntries(skills.map((s) => [s, 15])) } }
}

const box = (name: string) => within(screen.getByRole('region', { name }))
const percent = (table: string, skill: string) => within(within(screen.getByRole('table', { name: table })).getByText(skill).closest('tr')!).getAllByRole('cell').at(-1)

describe('Character Sheet', () => {
  test('opens only once every step is complete', () => {
    renderWith(throughCareer())
    expect(openStep(/Character Sheet/)).toBeDisabled()
  })

  test("shows Anathaym's identity, characteristics, skills and hit points", () => {
    renderWith(complete())
    fireEvent.click(openStep(/Character Sheet/))
    expect(box('Character').getByText('Anathaym')).toBeInTheDocument()
    expect(box('Character').getByText('Warrior')).toBeInTheDocument()
    expect(box('Characteristics and Attributes').getByText('Dexterity').nextSibling).toHaveTextContent('16')
    expect(box('Characteristics and Attributes').getByText('Initiative Bonus').nextSibling).toHaveTextContent('15')
    // Athletics 37 after career, +15 bonus.
    expect(percent('Standard Skills', 'Athletics')).toHaveTextContent('52')
    expect(percent('Resistances', 'Willpower')).toHaveTextContent('39')
    expect(percent('Professional Skills', 'Lore (Military History)')).toHaveTextContent('38')
    expect(percent('Languages', 'Native Tongue')).toHaveTextContent('63')
    expect(percent('Combat Styles', 'Meerish Slinger')).toHaveTextContent('52')
    // Max HP; the last column is left blank for current HP.
    const chest = within(within(screen.getByRole('table', { name: 'Hit Locations' })).getByText('Chest').closest('tr')!).getAllByRole('cell')
    expect(chest.map((c) => c.textContent)).toEqual(['10-12', 'Chest', '7', ''])
    expect(box('Money and Wealth').getByText('Starting money: 3375 SP')).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: 'Passions' })).getByText('Loyalty (Meeros)')).toBeInTheDocument()
  })
})

describe('file controls', () => {
  const importText = (text: string) => {
    const input = screen.getByLabelText('Import') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([text], 'character.json', { type: 'application/json' })] } })
  }

  test('importing a character file loads it', async () => {
    renderWith(newCharacter())
    importText(toJson(complete()))
    await waitFor(() => expect(openStep(/Character Sheet/)).toBeEnabled())
    expect(loadFromStorage()).toEqual(complete())
  })

  test('a bad file is rejected with a readable message and changes nothing', async () => {
    renderWith(complete())
    importText('{"schemaVersion": 1}')
    expect(await screen.findByRole('alert')).toHaveTextContent('This is not a valid character file')
    expect(loadFromStorage()?.concept.name).toBe('Anathaym')
  })

  test('New character asks first', () => {
    renderWith(complete())
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: 'New character' }))
    expect(loadFromStorage()?.concept.name).toBe('Anathaym')
    fireEvent.click(screen.getByRole('button', { name: 'New character' }))
    expect(loadFromStorage()).toEqual(newCharacter())
  })
})
