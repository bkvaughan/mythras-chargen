import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { CULTURES } from '../../data/cultures.ts'
import type { Character } from '../../state/character.ts'
import { openStep, problemTexts, renderWith, throughCareer } from '../testHelpers.tsx'

beforeEach(() => localStorage.clear())

function start(changes: Partial<Character> = {}) {
  renderWith({ ...throughCareer(), career: null, ...changes })
  fireEvent.click(openStep(/Career/))
}

const careerOptions = () => within(screen.getByLabelText('Career')).getAllByRole('option').map((o) => o.getAttribute('value'))
const choose = (career: string) => fireEvent.change(screen.getByLabelText('Career'), { target: { value: career } })
const points = (skill: string) => screen.getByLabelText(`${skill} points`)

describe('Career step', () => {
  test('lists only the careers open to the culture', () => {
    start()
    expect(problemTexts()).toEqual(['Choose a career'])
    expect(careerOptions()).toEqual(['', ...CULTURES.civilised.careers])
  })

  test('career points: at most 15 per skill, the whole pool, zero allowed', () => {
    start()
    choose('warrior')
    expect(points('Athletics')).toHaveValue(0)
    fireEvent.change(points('Athletics'), { target: { value: '16' } })
    expect(points('Athletics')).toHaveAttribute('aria-invalid', 'true')
    expect(problemTexts()).toContain('Athletics can receive at most 15 career points')
    expect(problemTexts()).toContain('84 career points left to spend')
    expect(screen.getByText('Career points left: 84', { selector: 'main p' })).toBeInTheDocument()
  })

  test('a culture professional skill can be picked again (R8)', () => {
    // Anathaym has Streetwise from her culture; as an Agent she can put career points into it.
    start()
    choose('agent')
    const options = within(screen.getByLabelText('Professional skill 1')).getAllByRole('option').map((o) => o.textContent)
    fireEvent.change(screen.getByLabelText('Professional skill 1'), { target: { value: String(options.indexOf('Streetwise') - 1) } })
    expect(points('Streetwise')).toBeInTheDocument()
    expect(problemTexts().some((p) => p?.includes('Streetwise'))).toBe(false)
  })

  test('the Warrior uses the cultural style and defines a Speciality Style (R9)', () => {
    start()
    choose('warrior')
    const cultural = within(screen.getByRole('group', { name: 'Cultural Style' }))
    expect(cultural.getByLabelText(/Use the cultural style, Meerish Slinger/)).toBeChecked()
    expect(cultural.getByLabelText('Define a new style')).toBeDisabled()
    const speciality = within(screen.getByRole('group', { name: 'Speciality Style' }))
    expect(speciality.queryByRole('radio')).toBeNull()
    expect(problemTexts()).toContain('A combat style needs a name')
    expect(points('Combat Style (Meerish Slinger)')).toBeInTheDocument()
  })

  test('without a cultural style, the Cultural Style slot defines one', () => {
    // Her culture points without the style: its 10 points move to Conceal.
    const culture = throughCareer().culture!
    const { 'Combat Style (Meerish Slinger)': _, ...rest } = culture.points
    start({ culture: { ...culture, combatStyle: null, points: { ...rest, Conceal: 15 } } })
    choose('warrior')
    const cultural = within(screen.getByRole('group', { name: 'Cultural Style' }))
    expect(cultural.getByLabelText(/none was taken/)).toBeDisabled()
    expect(cultural.getByLabelText('Define a new style')).toBeChecked()
    expect(cultural.getByLabelText('Combat Style name')).toBeInTheDocument()
  })

  test('Anathaym after the Warrior career, p. 27', () => {
    renderWith(throughCareer())
    fireEvent.click(openStep(/Career/))
    expect(screen.getByText('This step is complete.')).toBeInTheDocument()
    const table = within(screen.getByRole('table', { name: 'Career skill points' }))
    const total = (skill: string) => within(table.getByText(skill).closest('tr')!).getAllByRole('cell').at(-1)
    expect(total('Unarmed')).toHaveTextContent('37')
    expect(total('Combat Style (Meerish Slinger)')).toHaveTextContent('52')
    expect(total('Combat Style (Meerish Infantry)')).toHaveTextContent('42')
  })
})
