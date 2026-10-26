import { describe, expect, test } from 'vitest'
import type { AgeCategory } from '../data/age.ts'
import { bonusEligibleSkills, bonusProblems } from './bonus.ts'
import { ANATHAYM_CHOICES } from './testFixtures.ts'
import type { BonusChoices, SkillChoices } from './types.ts'

/** Spreads `pool` over the first skills at `per` points each. */
function spend(pool: number, per: number, skills: string[]): Record<string, number> {
  const points: Record<string, number> = {}
  for (const key of skills) {
    if (pool <= 0) break
    points[key] = Math.min(per, pool)
    pool -= points[key]
  }
  return points
}

const withBonus = (bonus: BonusChoices): SkillChoices => ({ ...ANATHAYM_CHOICES, bonus })
const eligible = bonusEligibleSkills(ANATHAYM_CHOICES)

describe('bonus points by age category (R11, R12)', () => {
  test.each<[AgeCategory, number, number]>([
    ['young', 100, 10],
    ['adult', 150, 15],
    ['middleAged', 200, 20],
    ['senior', 250, 25],
    ['old', 300, 30],
  ])('%s: %i points, at most %i per skill', (category, pool, max) => {
    expect(bonusProblems(withBonus({ hobby: null, points: spend(pool, max, eligible) }), category)).toEqual([])
    const tooMuch = { ...spend(pool - max - 1, max, eligible.slice(1)), [eligible[0]]: max + 1 }
    expect(bonusProblems(withBonus({ hobby: null, points: tooMuch }), category)).toEqual([
      `${eligible[0]} can receive at most ${max} bonus points`,
    ])
    expect(bonusProblems(withBonus({ hobby: null, points: spend(pool - 1, max, eligible) }), category)).toEqual([
      '1 bonus points left to spend',
    ])
  })
})

describe('eligibility (R11)', () => {
  test('all standard skills and every skill already held', () => {
    expect(eligible).toHaveLength(22 + 6 + 2)
    expect(eligible).toContain('Ride')
    expect(eligible).toContain('Lore (Military History)')
    expect(eligible).toContain('Combat Style (Meerish Infantry)')
  })

  test('a professional skill not held cannot take points', () => {
    const points = { ...spend(140, 15, eligible), Seduction: 10 }
    expect(bonusProblems(withBonus({ hobby: null, points }), 'adult')).toEqual(['Seduction cannot receive bonus points'])
  })

  test('the hobby skill can take points', () => {
    const points = { ...spend(140, 15, eligible), Seduction: 10 }
    const hobby = { kind: 'skill' as const, pick: { skill: 'Seduction' } }
    expect(bonusProblems(withBonus({ hobby, points }), 'adult')).toEqual([])
  })

  test('a hobby combat style can take points', () => {
    const style = { name: 'Street Brawler', weapons: 'Fists, club', trait: 'Unarmed Prowess' }
    const points = { ...spend(140, 15, eligible), 'Combat Style (Street Brawler)': 10 }
    expect(bonusProblems(withBonus({ hobby: { kind: 'style', style }, points }), 'adult')).toEqual([])
  })

  test('the hobby must be new and a professional skill', () => {
    const points = spend(150, 15, eligible)
    expect(bonusProblems(withBonus({ hobby: { kind: 'skill', pick: { skill: 'Courtesy' } }, points }), 'adult')).toEqual([
      'The hobby must be a new skill; Courtesy is already known',
    ])
    expect(bonusProblems(withBonus({ hobby: { kind: 'skill', pick: { skill: 'Ride' } }, points }), 'adult')).toEqual([
      'Ride is not a professional skill',
    ])
    const old = { name: 'Meerish Slinger', weapons: '', trait: null }
    expect(bonusProblems(withBonus({ hobby: { kind: 'style', style: old }, points }), 'adult')).toEqual([
      'The hobby combat style needs a new name',
    ])
  })
})
