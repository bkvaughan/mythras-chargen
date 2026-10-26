import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { ANATHAYM, ANATHAYM_CULTURE } from '../../engine/testFixtures.ts'
import type { Character } from '../../state/character.ts'
import { firstThreeSteps, openStep, problemTexts, renderWith } from '../testHelpers.tsx'

beforeEach(() => localStorage.clear())

// Anathaym as rolled, after her culture step.
const anathaym = (): Character => {
  const c = firstThreeSteps()
  return {
    ...c,
    concept: { ...c.concept, method: 'rollInOrder' },
    characteristics: { rolled: ANATHAYM, values: ANATHAYM },
    culture: { ...ANATHAYM_CULTURE, nativeTongue: '' },
  }
}

function start(concept: Partial<Character['concept']> = {}) {
  const c = anathaym()
  renderWith({ ...c, concept: { ...c.concept, ...concept } })
  fireEvent.click(openStep(/Background/))
}

const group = (name: string) => within(screen.getByRole('group', { name }))

describe('Background step', () => {
  test('lists the required items', () => {
    start()
    expect(problemTexts()).toEqual([
      'Roll or choose a social class',
      'Roll or enter starting money (4-24 on 4d6)',
      'Choose 1 background event (0 chosen)',
    ])
  })

  test('social class and starting money (R14)', () => {
    start()
    fireEvent.change(group('Social Class').getByLabelText('Result'), { target: { value: '96' } })
    expect(group('Social Class').getByLabelText('d100')).toHaveValue(96)
    expect(screen.getByText(/Money Modifier ×5/)).toBeInTheDocument()
    fireEvent.change(group('Starting Money').getByLabelText(/4d6/), { target: { value: '9' } })
    expect(group('Starting Money').getByText(': 3375 SP')).toBeInTheDocument()
  })

  test('a hand-entered roll outside 1-100 is not kept', () => {
    start()
    fireEvent.change(group('Social Class').getByLabelText('d100'), { target: { value: '0' } })
    expect(problemTexts()).toContain('Roll or choose a social class')
  })

  test('background events: one slot per event, no repeats', () => {
    start({ ageCategory: 'middleAged', age: 30 })
    expect(screen.queryByRole('group', { name: 'Background Event 2' })).toBeNull()
    fireEvent.change(group('Background Event 1').getByLabelText('d100'), { target: { value: '3' } })
    fireEvent.change(group('Background Event 2').getByLabelText('d100'), { target: { value: '4' } })
    expect(problemTexts()).toContain('Each background event can be taken only once')
    fireEvent.click(group('Background Event 2').getByRole('button', { name: 'Roll d100' }))
    expect(problemTexts()).not.toContain('Each background event can be taken only once')
    fireEvent.click(screen.getByRole('button', { name: 'Roll all events' }))
    expect(problemTexts().some((p) => p?.includes('background event'))).toBe(false)
  })

  test('young characters have no events', () => {
    start({ ageCategory: 'young', age: 14 })
    expect(screen.getByText('Young characters have no background events.')).toBeInTheDocument()
    expect(problemTexts()).not.toContain('Choose 0 background events (0 chosen)')
  })

  test('family counts follow the table row', () => {
    start()
    fireEvent.change(group('Siblings').getByLabelText('Result'), { target: { value: '11' } })
    fireEvent.change(group('Siblings').getByLabelText(/^Siblings/), { target: { value: '5' } })
    expect(problemTexts()).toContain('Siblings must be 1-4 on 1d4')
    fireEvent.change(group('Siblings').getByLabelText('Result'), { target: { value: '1' } })
    expect(group('Siblings').queryByRole('button', { name: /Roll 1d/ })).toBeNull()
    expect(problemTexts()).not.toContain('Siblings must be 1-4 on 1d4')
  })

  test('people from reputation and connections can be relabelled and named (R18)', () => {
    start()
    const people = () => group('Allies, Contacts, Enemies and Rivals')
    expect(people().getByRole('button', { name: 'Roll from reputation and connections' })).toBeDisabled()
    fireEvent.change(group('Reputation').getByLabelText('Result'), { target: { value: '16' } })
    fireEvent.click(people().getByRole('button', { name: 'Roll from reputation and connections' }))
    expect(['Enemy', 'Rival']).toContain((people().getByLabelText('Person 1 kind') as HTMLSelectElement).value)
    fireEvent.change(people().getByLabelText('Person 1 kind'), { target: { value: 'Rival' } })
    fireEvent.change(people().getByLabelText('Person 1 name'), { target: { value: 'Xenos' } })
    expect(people().getByLabelText('Person 1 name')).toHaveValue('Xenos')
  })

  test('marriage against base Influence, with children only when married (R21)', () => {
    start()
    const marriage = () => group('Marriage')
    // Base Influence 18: 2 or less is married, 18 or less betrothed.
    fireEvent.change(marriage().getByLabelText('d100'), { target: { value: '10' } })
    expect(marriage().getByText('Betrothed')).toBeInTheDocument()
    expect(marriage().queryByRole('button', { name: 'Add child' })).toBeNull()
    fireEvent.change(marriage().getByLabelText('d100'), { target: { value: '2' } })
    expect(marriage().getByText('Married')).toBeInTheDocument()
    fireEvent.click(marriage().getByRole('button', { name: 'Add child' }))
    fireEvent.change(marriage().getByLabelText('Child 1 age'), { target: { value: '7' } })
    expect(problemTexts()).toContain("Each child's age must be 1-4 on 1d4")
  })


  test('other Passions can be added and removed (R20)', () => {
    start()
    fireEvent.click(screen.getByRole('button', { name: 'Add a Passion' }))
    fireEvent.change(screen.getByLabelText('Passion 1'), { target: { value: 'Fear' } })
    fireEvent.change(screen.getByLabelText('Fear subject'), { target: { value: 'Wolves' } })
    fireEvent.change(screen.getByLabelText('Fear type'), { target: { value: 'race' } })
    const row = screen.getByLabelText('Fear subject').closest('tr')!
    expect(within(row).getAllByRole('cell').at(-2)).toHaveTextContent('44')
    fireEvent.click(within(row).getByRole('button', { name: 'Remove' }))
    expect(screen.queryByRole('table', { name: 'Other Passions' })).toBeNull()
  })
})
