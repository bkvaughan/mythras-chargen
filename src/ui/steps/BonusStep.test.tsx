import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { AGE_CATEGORIES } from '../../data/age.ts'
import { diceRange } from '../../engine/dice.ts'
import { openStep, problemTexts, renderWith, throughCareer } from '../testHelpers.tsx'

beforeEach(() => localStorage.clear())

const points = (skill: string) => screen.getByLabelText(`${skill} points`)
const keys = () =>
  within(screen.getByRole('table', { name: 'Bonus skill points' }))
    .getAllByRole('row')
    .slice(1)
    .map((r) => r.firstChild?.textContent)

describe('Bonus Skills step', () => {
  test.each(AGE_CATEGORIES)('$name: $bonusSkillPoints points, at most +$maxSkillIncrease per skill (R11, R12)', (category) => {
    renderWith(throughCareer({ ageCategory: category.category, age: diceRange(category.ageDice).min }))
    fireEvent.click(openStep(/Bonus Skills/))
    expect(screen.getByText(`Bonus points left: ${category.bonusSkillPoints}`, { selector: 'main p' })).toBeInTheDocument()
    fireEvent.change(points('Athletics'), { target: { value: String(category.maxSkillIncrease) } })
    expect(points('Athletics')).toHaveAttribute('aria-invalid', 'false')
    fireEvent.change(points('Athletics'), { target: { value: String(category.maxSkillIncrease + 1) } })
    expect(points('Athletics')).toHaveAttribute('aria-invalid', 'true')
    expect(problemTexts()).toContain(`Athletics can receive at most ${category.maxSkillIncrease} bonus points`)
  })

  test('only skills the character has, with every stage shown', () => {
    renderWith(throughCareer())
    fireEvent.click(openStep(/Bonus Skills/))
    expect(keys()).toContain('Courtesy')
    expect(keys()).toContain('Combat Style (Meerish Infantry)')
    expect(keys()).not.toContain('Oratory')
    // Athletics: base 27, career 10, total 37.
    const cells = within(points('Athletics').closest('tr')!).getAllByRole('cell').map((c) => c.textContent)
    expect(cells).toEqual(['Athletics', '27', '', '10', '', '37'])
  })

  test('a hobby skill joins the allocation; known skills are not offered (R11)', () => {
    renderWith(throughCareer())
    fireEvent.click(openStep(/Bonus Skills/))
    fireEvent.click(screen.getByLabelText('A new professional skill'))
    const options = within(screen.getByLabelText('Professional skill 1')).getAllByRole('option').map((o) => o.textContent)
    expect(options).not.toContain('Courtesy')
    expect(options).toContain('Lore')
    fireEvent.change(screen.getByLabelText('Professional skill 1'), { target: { value: String(options.indexOf('Oratory') - 1) } })
    expect(keys()).toContain('Oratory')
  })

  test('a hobby Combat Style joins the allocation', () => {
    renderWith(throughCareer())
    fireEvent.click(openStep(/Bonus Skills/))
    fireEvent.click(screen.getByLabelText('A new Combat Style'))
    fireEvent.change(screen.getByLabelText('Combat Style name'), { target: { value: 'Street Brawler' } })
    expect(keys()).toContain('Combat Style (Street Brawler)')
  })
})
