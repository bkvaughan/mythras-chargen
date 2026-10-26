import { describe, expect, test } from 'vitest'
import { allocationProblems, heldCombatStyles, heldProfessionalSkills, pickProblems, skillKey, styleProblems } from './skills.ts'
import { ANATHAYM_CHOICES } from './testFixtures.ts'

const rules = { pool: 30, min: 5, max: 15 }

describe('allocationProblems', () => {
  test('a valid allocation', () => {
    expect(allocationProblems({ A: 15, B: 10, C: 5 }, ['A', 'B', 'C'], rules, 'culture')).toEqual([])
  })

  test('under the minimum and over the maximum, at the edges', () => {
    expect(allocationProblems({ A: 16, B: 10, C: 4 }, ['A', 'B', 'C'], rules, 'culture')).toEqual([
      'A needs between 5 and 15 culture points',
      'C needs between 5 and 15 culture points',
    ])
  })

  test('an eligible skill left at zero is under the minimum', () => {
    expect(allocationProblems({ A: 15, B: 15 }, ['A', 'B', 'C'], rules, 'culture')).toEqual([
      'C needs between 5 and 15 culture points',
    ])
  })

  test('with no minimum, zero is fine and the message names the maximum', () => {
    expect(allocationProblems({ A: 15, B: 15 }, ['A', 'B', 'C'], { ...rules, min: 0 }, 'career')).toEqual([])
    expect(allocationProblems({ A: 16, B: 14 }, ['A', 'B'], { ...rules, min: 0 }, 'career')).toEqual([
      'A can receive at most 15 career points',
    ])
  })

  test('underspent and overspent', () => {
    expect(allocationProblems({ A: 15, B: 10, C: 4 }, ['A', 'B', 'C'], { ...rules, min: 0 }, 'bonus')).toEqual([
      '1 bonus points left to spend',
    ])
    expect(allocationProblems({ A: 15, B: 15, C: 1 }, ['A', 'B', 'C'], { ...rules, min: 0 }, 'bonus')).toEqual([
      '1 bonus points overspent',
    ])
  })

  test('points in an ineligible skill', () => {
    expect(allocationProblems({ A: 15, B: 10, X: 5 }, ['A', 'B'], { ...rules, min: 0 }, 'career')).toEqual([
      'X cannot receive career points',
    ])
    expect(allocationProblems({ A: 15, B: 15, X: 0 }, ['A', 'B'], { ...rules, min: 0 }, 'career')).toEqual([])
  })
})

describe('skill picks and styles', () => {
  test('keys include the specialisation', () => {
    expect(skillKey({ skill: 'Lore', specialisation: 'Geography' })).toBe('Lore (Geography)')
    expect(skillKey({ skill: 'Courtesy' })).toBe('Courtesy')
  })

  test('specialised skills need a specialisation (R7)', () => {
    expect(pickProblems({ skill: 'Craft' })).toEqual(['Craft needs a specialisation'])
    expect(pickProblems({ skill: 'Craft', specialisation: '  ' })).toEqual(['Craft needs a specialisation'])
    expect(pickProblems({ skill: 'Craft', specialisation: 'Pottery' })).toEqual([])
    expect(pickProblems({ skill: 'Juggling' })).toEqual(['Juggling is not a skill'])
  })

  test('a style needs a name and a listed trait (R10)', () => {
    expect(styleProblems({ name: 'Wolf Hunter', weapons: '', trait: null })).toEqual([])
    expect(styleProblems({ name: '', weapons: '', trait: 'Flying' })).toEqual([
      'A combat style needs a name',
      'Flying is not a combat style trait',
    ])
  })

  test('held skills merge culture and career without repeats (R8)', () => {
    const repeat = {
      ...ANATHAYM_CHOICES,
      career: { ...ANATHAYM_CHOICES.career!, professional: [{ skill: 'Lore', specialisation: 'Geography' }] },
    }
    expect(heldProfessionalSkills(repeat).map(skillKey)).toEqual(['Courtesy', 'Lore (Geography)', 'Streetwise'])
    expect(heldCombatStyles(ANATHAYM_CHOICES).map((s) => s.name)).toEqual(['Meerish Slinger', 'Meerish Infantry'])
  })
})
