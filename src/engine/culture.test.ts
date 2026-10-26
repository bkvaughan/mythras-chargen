import { describe, expect, test } from 'vitest'
import { cultureEligibleSkills, cultureProblems } from './culture.ts'
import { ANATHAYM_CULTURE } from './testFixtures.ts'
import type { CultureChoices } from './types.ts'

const valid = ANATHAYM_CULTURE
const withPoints = (changes: Record<string, number>): CultureChoices => ({ ...valid, points: { ...valid.points, ...changes } })

describe('cultureProblems', () => {
  test('no culture chosen', () => {
    expect(cultureProblems(null)).toEqual(['Choose a culture'])
  })

  test('Customs and Native Tongue are not culture skills; the +40 is automatic', () => {
    expect(cultureEligibleSkills(valid)).not.toContain('Customs')
    expect(cultureProblems(withPoints({ Customs: 5, Conceal: 0 }))).toContain('Customs cannot receive culture points')
  })

  test('every culture skill needs 5-15 points (R4)', () => {
    expect(cultureProblems(withPoints({ Drive: 4, Insight: 11 }))).toEqual(['Drive needs between 5 and 15 culture points'])
    expect(cultureProblems(withPoints({ Courtesy: 16, Streetwise: 14 }))).toEqual([
      'Courtesy needs between 5 and 15 culture points',
    ])
  })

  test('all 100 points must be spent (R5)', () => {
    expect(cultureProblems(withPoints({ Insight: 9 }))).toEqual(['1 culture points left to spend'])
  })

  test('without a combat style, its points are ineligible', () => {
    expect(cultureProblems({ ...valid, combatStyle: null })).toContain(
      'Combat Style (Meerish Slinger) cannot receive culture points',
    )
  })

  test('exactly three professional skills from the culture list', () => {
    expect(cultureProblems({ ...valid, professional: valid.professional.slice(0, 2) })).toContain(
      'Choose 3 professional skills (2 chosen)',
    )
    expect(cultureProblems({ ...valid, professional: [...valid.professional.slice(0, 2), { skill: 'Survival' }] })).toContain(
      'Survival is not a Civilised professional skill',
    )
  })

  test('the same specialised skill twice needs different specialisations (R7)', () => {
    const twoLores = [{ skill: 'Lore', specialisation: 'Geography' }, { skill: 'Lore', specialisation: 'Geography' }, { skill: 'Courtesy' }]
    expect(cultureProblems({ ...valid, professional: twoLores })).toContain('Each professional skill can be chosen only once')
  })

  test('choice groups (R6)', () => {
    const barbarian: CultureChoices = { ...valid, culture: 'barbarian', standardChoice: ['Ride'] }
    expect(cultureProblems(barbarian)).not.toContain('Choose 1 of Boating, Ride')
    expect(cultureProblems({ ...barbarian, standardChoice: [] })).toContain('Choose 1 of Boating, Ride')
    expect(cultureProblems({ ...barbarian, standardChoice: ['Swim'] })).toContain('Choose 1 of Boating, Ride')
    const nomad: CultureChoices = { ...valid, culture: 'nomadic', standardChoice: ['Ride', 'Ride'] }
    expect(cultureProblems(nomad)).toContain('Choose 2 of Athletics, Boating, Swim, Drive, Ride')
    expect(cultureProblems({ ...valid, standardChoice: ['Ride'] })).toContain('Civilised has no standard skill choice')
  })

  test('the chosen choice-group skill must receive points', () => {
    const barbarian: CultureChoices = { ...valid, culture: 'barbarian', standardChoice: ['Ride'] }
    expect(cultureEligibleSkills(barbarian)).toContain('Ride')
    expect(cultureEligibleSkills(barbarian)).not.toContain('Boating')
  })

  test('all three Passions need a subject and an object type (R23)', () => {
    const passions = [valid.passions[0], valid.passions[1], { ...valid.passions[2], subject: '' }]
    expect(cultureProblems({ ...valid, passions })).toEqual(['Name the subject and object type of all three Passions'])
  })
})
