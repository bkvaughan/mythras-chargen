import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import type { Character } from '../../state/character.ts'
import { openStep, problemTexts, renderWith, throughCareer } from '../testHelpers.tsx'

beforeEach(() => localStorage.clear())

// A Middle Aged Anathaym of 42, bonus points spent: one age band to roll.
function start(changes: Partial<Character> = {}) {
  const c = throughCareer({ ageCategory: 'middleAged', age: 42 })
  const points = Object.fromEntries(['Athletics', 'Brawn', 'Conceal', 'Customs', 'Dance', 'Deceit', 'Drive', 'Endurance', 'Evade', 'First Aid'].map((s) => [s, 20]))
  renderWith({ ...c, bonus: { hobby: null, points }, ...changes })
  fireEvent.click(openStep(/Ageing/))
}

const rolls = () => within(screen.getByRole('table', { name: 'Ageing rolls' }))
const after = (c: string) => within(screen.getByRole('table', { name: 'Characteristics after Ageing' })).getByText(c).closest('tr')!

describe('Ageing step (R17)', () => {
  test('asks for the rolls of each band passed', () => {
    start()
    expect(problemTexts()).toEqual(['Make the Ageing rolls for 1 age bands'])
    fireEvent.click(screen.getByRole('button', { name: 'Roll Ageing' }))
    expect(rolls().getAllByLabelText(/ d100$/)).toHaveLength(2)
  })

  test('targets use the grade and the skills after bonus points', () => {
    // Endurance 26 + 10 career + 20 bonus = 56, Easy: 56 + 28 = 84. Willpower 24, Easy 36.
    start({ ageing: [{ endurance: { d100: 50 }, willpower: { d100: 30 } }] })
    const row = (name: string) => within(rolls().getByLabelText(`Early Middle Age ${name} d100`).closest('tr')!).getAllByRole('cell')
    expect(row('Endurance')[1]).toHaveTextContent('84')
    expect(row('Willpower')[1]).toHaveTextContent('36')
    expect(row('Endurance')[3]).toHaveTextContent('Success')
    expect(screen.getByText('This step is complete.')).toBeInTheDocument()
  })

  test('a failure needs its effect and loss, then lowers the characteristic', () => {
    start({ ageing: [{ endurance: { d100: 99 }, willpower: { d100: 1 } }] })
    expect(problemTexts()).toEqual(['Early Middle Age: enter the Endurance Ageing effect and loss'])
    fireEvent.change(rolls().getByLabelText('Early Middle Age Endurance effect'), { target: { value: '1' } })
    fireEvent.change(rolls().getByLabelText('Early Middle Age Endurance loss'), { target: { value: '3' } })
    expect(rolls().getByText('Failure: -3 STR')).toBeInTheDocument()
    expect(within(after('STR')).getAllByRole('cell').map((c) => c.textContent)).toEqual(['STR', '11', '8'])
    expect(screen.getByText('This step is complete.')).toBeInTheDocument()
  })

  test('an effect outside 1d6 is not kept', () => {
    start({ ageing: [{ endurance: { d100: 99 }, willpower: { d100: 1 } }] })
    fireEvent.change(rolls().getByLabelText('Early Middle Age Endurance effect'), { target: { value: '7' } })
    expect(problemTexts()).toEqual(['Early Middle Age: enter the Endurance Ageing effect and loss'])
  })

  test('a characteristic reduced to 0 makes the step invalid', () => {
    const c = throughCareer({ ageCategory: 'middleAged', age: 42 })
    start({
      characteristics: { rolled: { ...c.characteristics.rolled!, STR: 3 }, values: { ...c.characteristics.values!, STR: 3 } },
      ageing: [{ endurance: { d100: 99, effect: 1, loss: 3 }, willpower: { d100: 1 } }],
    })
    expect(problemTexts()).toContain('Ageing has reduced STR to 0; re-roll or edit the Ageing results')
  })
})
