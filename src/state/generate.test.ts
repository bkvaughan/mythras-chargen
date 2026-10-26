import { describe, expect, test } from 'vitest'
import { seededRng } from '../engine/dice.ts'
import { characterSchema } from './character.ts'
import { deriveCharacter, STEPS } from './derive.ts'
import { allocate, generateCharacter } from './generate.ts'

describe('generateCharacter', () => {
  test('500 seeds: every character passes every step and is a valid character file', () => {
    const seen = { cultures: new Set<string>(), careers: new Set<string>(), ages: new Set<string>(), methods: new Set<string>() }
    for (let seed = 1; seed <= 500; seed++) {
      const c = generateCharacter(seededRng(seed))
      const derived = deriveCharacter(c)
      for (const step of STEPS) expect(derived.steps[step].problems, `seed ${seed}, ${step}`).toEqual([])
      expect(characterSchema.safeParse(c).success, `seed ${seed}`).toBe(true)
      seen.cultures.add(c.culture!.culture)
      seen.careers.add(c.career!.career)
      seen.ages.add(c.concept.ageCategory)
      seen.methods.add(c.concept.method!)
    }
    // Every culture, age category and method turns up, and most careers.
    expect(seen.cultures.size).toBe(4)
    expect(seen.ages.size).toBe(5)
    expect(seen.methods.size).toBe(3)
    expect(seen.careers.size).toBeGreaterThanOrEqual(20)
  })

  test('the same seed gives the same character', () => {
    expect(generateCharacter(seededRng(42))).toEqual(generateCharacter(seededRng(42)))
  })

  test('names are left blank (R19) and Passions get generic subjects (R25)', () => {
    const c = generateCharacter(seededRng(7))
    expect(c.concept.name).toBe('')
    expect(c.culture!.passions.every((p) => p.subject !== '' && p.object !== null)).toBe(true)
  })
})

describe('allocate', () => {
  test('spends the whole pool in fives within min and max', () => {
    const rng = seededRng(3)
    for (let i = 0; i < 50; i++) {
      const points = allocate(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], 100, 5, 15, rng)
      const values = Object.values(points)
      expect(values.reduce((a, b) => a + b, 0)).toBe(100)
      expect(values.every((v) => v >= 5 && v <= 15 && v % 5 === 0)).toBe(true)
    }
  })

  test('drops skills left at zero', () => {
    expect(allocate(['A', 'B'], 15, 0, 15, seededRng(1))).toEqual(expect.not.objectContaining({ A: 0 }))
  })

  test('refuses a pool that cannot fit', () => {
    expect(() => allocate(['A', 'B'], 100, 0, 15, seededRng(1))).toThrow('Cannot spend 100 points on 2 skills')
  })
})
