import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { newCharacter, type Character } from '../state/character.ts'
import { saveToStorage } from '../state/persistence.ts'
import App from './App.tsx'

beforeEach(() => localStorage.clear())

const problemList = () => screen.queryByText('To complete this step:')?.parentElement?.querySelectorAll('li') ?? []
const problemTexts = () => [...problemList()].map((li) => li.textContent)
const next = () => screen.getByRole('button', { name: /^Next/ })
const step = (name: RegExp) => within(screen.getByRole('navigation')).getByRole('button', { name })

function startWith(changes: Partial<Character>) {
  saveToStorage({ ...newCharacter(), ...changes })
  render(<App />)
}

const concept = (method: Character['concept']['method']) => ({
  concept: { ...newCharacter().concept, name: 'Anathaym', age: 20, method },
})

describe('wizard shell', () => {
  test('shows the app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mythras Character Generator')
  })

  test('later steps are locked until earlier ones are complete', () => {
    render(<App />)
    expect(step(/Concept/)).toHaveAttribute('aria-current', 'step')
    expect(step(/Characteristics/)).toBeDisabled()
    expect(next()).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Ageing/ })).toBeNull()
  })

  test('Back and Next move between steps', () => {
    startWith(concept('pointsBuild'))
    fireEvent.click(next())
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Characteristics')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Concept')
  })

  test('a refresh returns to the step the player was on', () => {
    saveToStorage({ ...newCharacter(), ...concept('pointsBuild') })
    localStorage.setItem('mythras-chargen:step', 'characteristics')
    render(<App />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Characteristics')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(localStorage.getItem('mythras-chargen:step')).toBe('concept')
  })

  test('a saved step that cannot be opened falls back to Concept', () => {
    localStorage.setItem('mythras-chargen:step', 'career')
    render(<App />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Concept')
  })

  test('the Ageing step appears for characters aged 40 or more', () => {
    startWith({ concept: { ...concept('pointsBuild').concept, ageCategory: 'senior', age: 50 } })
    expect(step(/Ageing/)).toBeInTheDocument()
  })
})

describe('Concept step', () => {
  test('lists what is missing, then completes', () => {
    render(<App />)
    expect(problemTexts()).toEqual([
      'Roll or enter an age between 17 and 27 for the Adult age category',
      'Choose how to generate characteristics',
    ])
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '30' } })
    expect(screen.getByLabelText('Age')).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '20' } })
    fireEvent.click(screen.getByLabelText(/Points build/))
    expect(screen.getByText('This step is complete.')).toBeInTheDocument()
    expect(next()).toBeEnabled()
  })

  test('rolling the age stays in the category range', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Roll 2d6+15' }))
    const age = Number((screen.getByLabelText('Age') as HTMLInputElement).value)
    expect(age).toBeGreaterThanOrEqual(17)
    expect(age).toBeLessThanOrEqual(27)
  })
})

describe('Characteristics step', () => {
  test('points build counts down and validates', () => {
    startWith(concept('pointsBuild'))
    fireEvent.click(next())
    expect(screen.getByText('Points remaining: 44')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Strength (STR)'), { target: { value: '19' } })
    expect(problemTexts()).toContain('STR must be between 3 and 18')
    fireEvent.change(screen.getByLabelText('Strength (STR)'), { target: { value: '18' } })
    expect(screen.getByText('Points remaining: 29')).toBeInTheDocument()
    expect(problemTexts()).toEqual(['29 characteristic points left to spend'])
  })

  test('roll and assign swaps within the same dice only', () => {
    startWith(concept('rollAndAssign'))
    fireEvent.click(next())
    fireEvent.click(screen.getByRole('button', { name: 'Enter my own rolls' }))
    fireEvent.change(screen.getByLabelText('Strength (STR)'), { target: { value: '15' } })
    const swapStr = screen.getByLabelText('Swap STR with')
    const options = within(swapStr).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['-', 'CON (3)', 'DEX (3)', 'POW (3)', 'CHA (3)'])
    fireEvent.change(swapStr, { target: { value: 'CHA' } })
    const row = (name: string) => screen.getByLabelText(name).closest('tr')!
    expect(within(row('Strength (STR)')).getAllByRole('cell')[3]).toHaveTextContent('3')
    expect(within(row('Charisma (CHA)')).getAllByRole('cell')[3]).toHaveTextContent('15')
    expect(screen.getByText('This step is complete.')).toBeInTheDocument()
  })

  test('a hand-entered roll outside the dice range is a problem', () => {
    startWith(concept('rollInOrder'))
    fireEvent.click(next())
    fireEvent.click(screen.getByRole('button', { name: 'Enter my own rolls' }))
    fireEvent.change(screen.getByLabelText('Size (SIZ)'), { target: { value: '7' } })
    expect(problemTexts()).toEqual(['SIZ must be 8-18 on 2d6+6'])
  })
})

describe('Attributes step', () => {
  test('shows derived attributes and checks height and weight', () => {
    startWith({
      ...concept('pointsBuild'),
      characteristics: { rolled: null, values: { STR: 11, CON: 13, SIZ: 10, DEX: 16, INT: 14, POW: 7, CHA: 4 } },
    })
    fireEvent.click(step(/Attributes/))
    const attributes = within(screen.getByRole('table', { name: 'Attributes' }))
    expect(attributes.getByText('Initiative Bonus').nextSibling).toHaveTextContent('15')
    expect(attributes.getByText('Experience Modifier').nextSibling).toHaveTextContent('-1')
    expect(problemTexts()).toEqual(['Choose a frame'])

    fireEvent.click(screen.getByLabelText(/Lithe/))
    expect(screen.getByText('161-165 cm for SIZ 10')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Height (cm)'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '47' } })
    expect(problemTexts()).toEqual(['Height must be 161-165 cm for SIZ 10'])
    fireEvent.click(screen.getByRole('button', { name: 'Roll height and weight' }))
    expect(screen.getByText('This step is complete.')).toBeInTheDocument()
  })
})

describe('summary panel', () => {
  test('shows the name, characteristics and key attributes', () => {
    startWith({
      ...concept('pointsBuild'),
      characteristics: { rolled: null, values: { STR: 11, CON: 13, SIZ: 10, DEX: 16, INT: 14, POW: 7, CHA: 4 } },
    })
    const summary = within(screen.getByRole('complementary', { name: 'Character summary' }))
    expect(summary.getByRole('heading')).toHaveTextContent('Anathaym')
    expect(summary.getByText('DEX').nextSibling).toHaveTextContent('16')
    expect(summary.getByText('Action Points').nextSibling).toHaveTextContent('3')
  })
})
