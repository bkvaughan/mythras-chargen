import { describe, expect, test } from 'vitest'
import { assignmentProblems, pointsBuildProblems, rollCharacteristics, rolledProblems, withModifiers } from './characteristics.ts'
import { seededRng } from './dice.ts'
import { ANATHAYM } from './testFixtures.ts'

describe('rollCharacteristics', () => {
  test('3d6 for STR, CON, DEX, POW, CHA; 2d6+6 for SIZ and INT', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 500; i++) {
      const c = rollCharacteristics(rng)
      for (const k of ['STR', 'CON', 'DEX', 'POW', 'CHA'] as const) expect(c[k]).toBeGreaterThanOrEqual(3)
      expect(c.SIZ).toBeGreaterThanOrEqual(8)
      expect(c.INT).toBeGreaterThanOrEqual(8)
      expect(Math.max(...Object.values(c))).toBeLessThanOrEqual(18)
    }
  })
})

describe('roll and assign (R2)', () => {
  // Anathaym rolled 11, 7, 13, 9, 16 on 3d6 and 10, 14 on 2d6+6 (p. 12).
  const rolled = { STR: 11, CON: 7, DEX: 13, POW: 9, CHA: 16, SIZ: 10, INT: 14 }

  test('swaps within each dice group are allowed', () => {
    expect(assignmentProblems(rolled, ANATHAYM)).toEqual([])
    expect(assignmentProblems(rolled, rolled)).toEqual([])
  })

  test('a swap across groups is rejected', () => {
    expect(assignmentProblems(rolled, { ...rolled, STR: 14, INT: 11 })).toHaveLength(2)
  })

  test('a changed value is rejected', () => {
    expect(assignmentProblems(rolled, { ...rolled, STR: 12 })).toEqual([
      'STR, CON, DEX, POW, CHA must use the values rolled on 3d6: 7, 9, 11, 13, 16',
    ])
  })
})

describe('points build (R3)', () => {
  const valid = { STR: 10, CON: 10, SIZ: 12, DEX: 11, INT: 12, POW: 10, CHA: 10 }

  test('75 points within limits is valid', () => {
    expect(pointsBuildProblems(valid)).toEqual([])
  })

  test('minimums: 3, and 8 for INT and SIZ', () => {
    expect(pointsBuildProblems({ ...valid, STR: 3, CHA: 17 })).toEqual([])
    expect(pointsBuildProblems({ ...valid, STR: 2, CHA: 18 })).toContain('STR must be between 3 and 18')
    expect(pointsBuildProblems({ ...valid, SIZ: 8, CHA: 14 })).toEqual([])
    expect(pointsBuildProblems({ ...valid, SIZ: 7, CHA: 15 })).toContain('SIZ must be between 8 and 18')
    expect(pointsBuildProblems({ ...valid, INT: 7, CHA: 15 })).toContain('INT must be between 8 and 18')
  })

  test('maximum 18', () => {
    expect(pointsBuildProblems({ ...valid, STR: 18, CON: 3, CHA: 9 })).toEqual([])
    expect(pointsBuildProblems({ ...valid, STR: 19, CON: 3, CHA: 8 })).toContain('STR must be between 3 and 18')
  })

  test('all 75 points must be spent', () => {
    expect(pointsBuildProblems({ ...valid, STR: 9 })).toEqual(['1 characteristic points left to spend'])
    expect(pointsBuildProblems({ ...valid, STR: 12 })).toEqual(['2 characteristic points overspent'])
  })
})

test('withModifiers applies losses to a copy', () => {
  expect(withModifiers(ANATHAYM, { CON: -2, POW: -1 })).toEqual({ ...ANATHAYM, CON: 11, POW: 6 })
  expect(ANATHAYM.CON).toBe(13)
})

test('hand-entered rolls must be possible on the dice', () => {
  expect(rolledProblems(ANATHAYM)).toEqual([])
  expect(rolledProblems({ ...ANATHAYM, STR: 3, SIZ: 8, CHA: 18 })).toEqual([])
  expect(rolledProblems({ ...ANATHAYM, STR: 2, SIZ: 7, CHA: 19 })).toEqual([
    'STR must be 3-18 on 3d6',
    'SIZ must be 8-18 on 2d6+6',
    'CHA must be 3-18 on 3d6',
  ])
})
