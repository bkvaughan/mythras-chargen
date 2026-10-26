import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { firstThreeSteps, openStep, problemTexts, renderWith } from '../testHelpers.tsx'

beforeEach(() => {
  localStorage.clear()
  renderWith(firstThreeSteps())
  fireEvent.click(openStep(/Culture/))
})

const choose = (name: string) => fireEvent.click(screen.getByLabelText(new RegExp(`^${name}`)))
const points = (skill: string) => screen.getByLabelText(`${skill} points`)
const setPoints = (skill: string, value: number) => fireEvent.change(points(skill), { target: { value: String(value) } })
const allocationKeys = () =>
  within(screen.getByRole('table', { name: 'Culture skill points' }))
    .getAllByRole('row')
    .slice(1)
    .map((r) => r.firstChild?.textContent)

describe('Culture step', () => {
  test('needs a culture first', () => {
    expect(problemTexts()).toEqual(['Choose a culture'])
  })

  test('lists the culture skills to allocate, with base and total', () => {
    choose('Civilised')
    expect(allocationKeys()).toEqual(['Conceal', 'Deceit', 'Drive', 'Influence', 'Insight', 'Locale', 'Willpower'])
    setPoints('Influence', 10)
    // CHA 4: base Influence 8.
    const row = points('Influence').closest('tr')!
    expect(within(row).getAllByRole('cell').map((c) => c.textContent)).toEqual(['Influence', '8', '', '18'])
    // Seven skills start at 5 each; Influence went up to 10.
    expect(screen.getByText('Culture points left: 60', { selector: 'main p' })).toBeInTheDocument()
  })

  test('allocation rules: per-skill minimum and maximum, the whole pool', () => {
    choose('Civilised')
    setPoints('Conceal', 20)
    expect(points('Conceal')).toHaveAttribute('aria-invalid', 'true')
    expect(points('Deceit')).toHaveValue(5)
    expect(problemTexts()).toEqual(['Choose 3 professional skills (0 chosen)', 'Conceal needs between 5 and 15 culture points', '50 culture points left to spend', 'Name the subject and object type of all three Passions'])
    setPoints('Conceal', 3)
    expect(points('Conceal')).toHaveAttribute('aria-invalid', 'true')
    setPoints('Conceal', 15)
    expect(points('Conceal')).toHaveAttribute('aria-invalid', 'false')
    expect(points('Deceit')).toHaveAttribute('aria-invalid', 'false')
  })

  test('professional picks take specialisations and join the allocation', () => {
    choose('Civilised')
    fireEvent.change(screen.getByLabelText('Professional skill 1'), { target: { value: '5' } }) // Lore
    expect(problemTexts()).toContain('Lore needs a specialisation')
    fireEvent.change(screen.getByLabelText('Specialisation 1'), { target: { value: 'Geography' } })
    fireEvent.change(screen.getByLabelText('Professional skill 2'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Specialisation 2'), { target: { value: 'History' } })
    expect(screen.queryByLabelText('Professional skill 4')).toBeNull()
    expect(allocationKeys()).toContain('Lore (Geography)')
    expect(allocationKeys()).toContain('Lore (History)')
    expect(problemTexts()).toContain('Choose 3 professional skills (2 chosen)')
  })

  test('a skill without a specialisation can be picked only once', () => {
    choose('Civilised')
    fireEvent.change(screen.getByLabelText('Professional skill 1'), { target: { value: '7' } }) // Streetwise
    const second = within(screen.getByLabelText('Professional skill 2'))
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(second).not.toContain('Streetwise')
    expect(second).toContain('Lore')
  })

  test('points follow a specialisation as it is renamed', () => {
    choose('Civilised')
    fireEvent.change(screen.getByLabelText('Professional skill 1'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Specialisation 1'), { target: { value: 'Geo' } })
    setPoints('Lore (Geo)', 10)
    fireEvent.change(screen.getByLabelText('Specialisation 1'), { target: { value: 'Geography' } })
    expect(points('Lore (Geography)')).toHaveValue(10)
  })

  test('an optional Combat Style joins the allocation', () => {
    choose('Civilised')
    fireEvent.click(screen.getByLabelText('Take a cultural Combat Style'))
    expect(problemTexts()).toContain('A combat style needs a name')
    fireEvent.change(screen.getByLabelText('Combat Style name'), { target: { value: 'Town Militia' } })
    expect(allocationKeys()).toContain('Combat Style (Town Militia)')
    fireEvent.change(screen.getByLabelText('Combat Style name'), { target: { value: 'custom' } })
    expect(screen.getByLabelText('Custom name')).toHaveValue('')
    fireEvent.change(screen.getByLabelText('Custom name'), { target: { value: 'Meerish Slinger' } })
    fireEvent.change(screen.getByLabelText('Trait'), { target: { value: 'Skirmishing' } })
    expect(screen.getByText(/ranged attacks while running/)).toBeInTheDocument()
    expect(allocationKeys()).toContain('Combat Style (Meerish Slinger)')
  })

  test('choice groups (R6): Nomadic picks two', () => {
    choose('Nomadic')
    expect(problemTexts()).toContain('Choose 2 of Athletics, Boating, Swim, Drive, Ride')
    fireEvent.click(screen.getByLabelText('Ride'))
    fireEvent.click(screen.getByLabelText('Swim'))
    expect(problemTexts().some((p) => p?.startsWith('Choose 2 of'))).toBe(false)
    expect(allocationKeys()).toContain('Ride')
  })

  test('Passions need a subject and type; the type sets the value (R13)', () => {
    choose('Civilised')
    expect(problemTexts()).toContain('Name the subject and object type of all three Passions')
    fireEvent.change(screen.getByLabelText('Love subject'), { target: { value: 'Kara' } })
    fireEvent.change(screen.getByLabelText('Love type'), { target: { value: 'romantic' } })
    const row = screen.getByLabelText('Love subject').closest('tr')!
    // 30 + own POW 7 + own CHA 4 until the subject's are entered.
    expect(within(row).getAllByRole('cell').at(-1)).toHaveTextContent('41')
    fireEvent.change(screen.getByLabelText("Love subject's CHA"), { target: { value: '14' } })
    expect(within(row).getAllByRole('cell').at(-1)).toHaveTextContent('51')
  })
})
