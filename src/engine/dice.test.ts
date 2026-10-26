import { describe, expect, test } from 'vitest'
import { diceRange, lookupBracket, lookupRow, parseDice, roll, rollBetween, rollDie, seededRng } from './dice.ts'

describe('parseDice', () => {
  test.each([
    ['3d6', [{ sign: 1, count: 3, sides: 6 }]],
    ['2d6+6', [{ sign: 1, count: 2, sides: 6 }, { sign: 1, count: 6, sides: 0 }]],
    ['1d3-1', [{ sign: 1, count: 1, sides: 3 }, { sign: -1, count: 1, sides: 0 }]],
    ['1d8+1d6', [{ sign: 1, count: 1, sides: 8 }, { sign: 1, count: 1, sides: 6 }]],
    ['1', [{ sign: 1, count: 1, sides: 0 }]],
  ])('%s', (expr, terms) => expect(parseDice(expr)).toEqual(terms))

  test.each(['', 'd6', '3x6', '2d6++1', 'abc'])('rejects %j', (expr) => expect(() => parseDice(expr)).toThrow())
})

describe('diceRange', () => {
  test.each([
    ['3d6', 3, 18],
    ['2d6+6', 8, 18],
    ['1d3-1', 0, 2],
    ['4d6', 4, 24],
    ['5d6+60', 65, 90],
    ['1d4-1', 0, 3],
    ['1', 1, 1],
  ])('%s is %i-%i', (expr, min, max) => expect(diceRange(expr)).toEqual({ min, max }))
})

describe('rolling', () => {
  test('a seeded generator repeats its sequence', () => {
    const a = seededRng(42)
    const b = seededRng(42)
    expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b))
  })

  test('rolls stay within range and reach both ends', () => {
    const rng = seededRng(1)
    for (const expr of ['3d6', '2d6+6', '1d3-1', '4d6']) {
      const { min, max } = diceRange(expr)
      const results = new Set(Array.from({ length: 20000 }, () => roll(expr, rng)))
      expect(Math.min(...results)).toBe(min)
      expect(Math.max(...results)).toBe(max)
    }
  })

  test('rollDie uses the whole of [0, 1)', () => {
    expect(rollDie(6, () => 0)).toBe(1)
    expect(rollDie(6, () => 0.9999)).toBe(6)
    expect(rollBetween(161, 165, () => 0)).toBe(161)
    expect(rollBetween(161, 165, () => 0.9999)).toBe(165)
  })
})

describe('lookups', () => {
  const rows = [
    { min: 1, max: 20, result: 'a' },
    { min: 21, max: 100, result: 'b' },
  ]
  test('table rows at their edges', () => {
    expect(lookupRow(rows, 1)).toBe('a')
    expect(lookupRow(rows, 20)).toBe('a')
    expect(lookupRow(rows, 21)).toBe('b')
    expect(lookupRow(rows, 100)).toBe('b')
    expect(() => lookupRow(rows, 0)).toThrow()
  })

  test('brackets at their edges', () => {
    const brackets = [
      { upTo: 12, value: 1 },
      { upTo: 24, value: 2 },
    ]
    expect(lookupBracket(brackets, 12)).toBe(1)
    expect(lookupBracket(brackets, 13)).toBe(2)
    expect(() => lookupBracket(brackets, 25)).toThrow()
  })
})
