import { describe, expect, test } from 'vitest'
import type { DifficultyGrade } from '../data/age.ts'
import { ageingBands, gradedValue, resolveAgeing, rollAgeing, rollSucceeds, type AgeingBandRolls } from './ageing.ts'
import { deriveAttributes } from './attributes.ts'
import { withModifiers } from './characteristics.ts'
import { seededRng } from './dice.ts'
import { skillTable } from './skills.ts'
import { ANATHAYM, ANATHAYM_CHOICES } from './testFixtures.ts'

describe('difficulty grades (R22)', () => {
  test.each<[DifficultyGrade, number, number | null]>([
    ['veryEasy', 50, 100],
    ['easy', 50, 75],
    ['easy', 51, 77],
    ['standard', 51, 51],
    ['hard', 50, 33],
    ['hard', 51, 34],
    ['formidable', 51, 25],
    ['herculean', 51, 6],
    ['herculean', 50, 5],
    ['hopeless', 50, null],
  ])('%s %i is %s', (grade, skill, value) => expect(gradedValue(skill, grade)).toBe(value))
})

describe('rollSucceeds', () => {
  test.each([
    [5, 1, true],
    [6, 5, false],
    [6, 6, true],
    [95, 200, true],
    [96, 200, false],
    [1, null, false],
  ])('d100 %i against %s is %s', (d100, target, success) => expect(rollSucceeds(d100, target)).toBe(success))
})

describe('ageing bands (R17)', () => {
  test.each([
    [39, 0],
    [40, 1],
    [49, 1],
    [50, 2],
    [65, 3],
    [89, 5],
    [90, 6],
  ])('age %i passes %i bands', (age, count) => expect(ageingBands(age)).toHaveLength(count))
})

const pass = { d100: 1 }
const fail = (effect: number, loss: number) => ({ d100: 99, effect, loss })

describe('resolveAgeing', () => {
  test('no bands under 40', () => {
    expect(resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 39, [])).toEqual({ outcomes: [], modifiers: {}, problems: [] })
  })

  test('passing every roll changes nothing', () => {
    const result = resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 45, [{ endurance: pass, willpower: pass }])
    expect(result.modifiers).toEqual({})
    expect(result.problems).toEqual([])
    // Endurance 36 at Easy is 54; Willpower 24 at Easy is 36.
    expect(result.outcomes[0].rolls.map((r) => r.target)).toEqual([54, 36])
  })

  test('a failed roll loses 1d3 from the Ageing Effects characteristic', () => {
    const result = resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 45, [{ endurance: fail(3, 2), willpower: fail(6, 1) }])
    expect(result.modifiers).toEqual({ CON: -2, CHA: -1 })
    expect(result.problems).toEqual([])
  })

  test('losses lower bases and attributes but keep allocations', () => {
    const { modifiers } = resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 45, [{ endurance: fail(3, 3), willpower: pass }])
    const aged = withModifiers(ANATHAYM, modifiers)
    const endurance = skillTable(aged, ANATHAYM_CHOICES).find((r) => r.key === 'Endurance')!
    expect(endurance.base).toBe(20)
    expect(endurance.career).toBe(10)
    expect(deriveAttributes(aged).healingRate).toBe(2)
  })

  test('later bands roll against the reduced values', () => {
    const rolls: AgeingBandRolls[] = [
      { endurance: fail(3, 3), willpower: pass },
      { endurance: pass, willpower: pass },
    ]
    // After losing 3 CON, Endurance is 30; Middle Age is Standard.
    expect(resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 50, rolls).outcomes[1].rolls[0].target).toBe(30)
  })

  test('Dotage always fails, even on 01', () => {
    const rolls = Array.from({ length: 6 }, (): AgeingBandRolls => ({ endurance: pass, willpower: pass }))
    rolls[5] = { endurance: { d100: 1, effect: 1, loss: 1 }, willpower: { d100: 1, effect: 1, loss: 1 } }
    expect(resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 90, rolls).modifiers).toEqual({ STR: -1, INT: -1 })
  })

  test('missing rolls or effects are problems', () => {
    expect(resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 50, []).problems).toEqual(['Make the Ageing rolls for 2 age bands'])
    expect(resolveAgeing(ANATHAYM, ANATHAYM_CHOICES, 45, [{ endurance: { d100: 99 }, willpower: pass }]).problems).toEqual([
      'Early Middle Age: enter the Endurance Ageing effect and loss',
    ])
  })

  test('a characteristic reduced to 0 is invalid', () => {
    const weak = { ...ANATHAYM, DEX: 2 }
    const result = resolveAgeing(weak, ANATHAYM_CHOICES, 45, [{ endurance: fail(5, 2), willpower: pass }])
    expect(result.problems).toEqual(['Ageing has reduced DEX to 0; re-roll or edit the Ageing results'])
  })

  test('rollAgeing makes one pair of rolls per band', () => {
    const rolls = rollAgeing(65, seededRng(5))
    expect(rolls).toHaveLength(3)
    for (const r of rolls.flatMap((b) => [b.endurance, b.willpower])) {
      expect(r.d100).toBeGreaterThanOrEqual(1)
      expect(r.d100).toBeLessThanOrEqual(100)
      expect(r.effect).toBeLessThanOrEqual(6)
      expect(r.loss).toBeLessThanOrEqual(3)
    }
  })
})
