import { describe, expect, test } from 'vitest'
import { deriveAttributes, heightWeightRange, rollHeightWeight } from './attributes.ts'
import { DAMAGE_MODIFIER } from '../data/attributes.ts'
import { lookupBracket, seededRng } from './dice.ts'
import type { Characteristics } from './types.ts'

const base: Characteristics = { STR: 10, CON: 10, SIZ: 10, DEX: 10, INT: 10, POW: 10, CHA: 10 }
const attrs = (changes: Partial<Characteristics>) => deriveAttributes({ ...base, ...changes })

describe('Action Points by INT+DEX', () => {
  test.each([
    [3, 9, 1], // 12
    [4, 9, 2], // 13
    [12, 12, 2], // 24
    [12, 13, 3], // 25
    [18, 18, 3], // 36
  ])('INT %i DEX %i gives %i', (INT, DEX, ap) => expect(attrs({ INT, DEX }).actionPoints).toBe(ap))
})

describe('Damage Modifier by STR+SIZ', () => {
  test.each([
    [5, '-1d8'],
    [6, '-1d6'],
    [10, '-1d6'],
    [11, '-1d4'],
    [15, '-1d4'],
    [16, '-1d2'],
    [20, '-1d2'],
    [21, '+0'],
    [25, '+0'],
    [26, '+1d2'],
    [30, '+1d2'],
    [31, '+1d4'],
    [35, '+1d4'],
    [36, '+1d6'],
  ])('STR+SIZ %i gives %s', (sum, dm) => expect(attrs({ STR: sum - 8, SIZ: 8 }).damageModifier).toBe(dm))

  // Brackets above 36 are out of human reach but are still checked at every edge.
  test('every bracket edge up to 130', () => {
    DAMAGE_MODIFIER.forEach((b, i) => {
      expect(lookupBracket(DAMAGE_MODIFIER, b.upTo)).toBe(b.value)
      if (i > 0) expect(lookupBracket(DAMAGE_MODIFIER, DAMAGE_MODIFIER[i - 1].upTo + 1)).toBe(b.value)
    })
  })
})

describe('Experience Modifier, Healing Rate, Luck Points', () => {
  test.each([
    [1, -1, 1, 1],
    [6, -1, 1, 1],
    [7, 0, 2, 2],
    [12, 0, 2, 2],
    [13, 1, 3, 3],
    [18, 1, 3, 3],
  ])('value %i', (v, exp, heal, luck) => {
    expect(attrs({ CHA: v }).experienceModifier).toBe(exp)
    expect(attrs({ CON: v }).healingRate).toBe(heal)
    expect(attrs({ POW: v }).luckPoints).toBe(luck)
  })
})

describe('Hit Points by CON+SIZ', () => {
  test.each([
    [5, 1, 3, 2, 1, 1],
    [6, 2, 4, 3, 1, 2],
    [10, 2, 4, 3, 1, 2],
    [11, 3, 5, 4, 2, 3],
    [15, 3, 5, 4, 2, 3],
    [16, 4, 6, 5, 3, 4],
    [20, 4, 6, 5, 3, 4],
    [21, 5, 7, 6, 4, 5],
    [25, 5, 7, 6, 4, 5],
    [26, 6, 8, 7, 5, 6],
    [30, 6, 8, 7, 5, 6],
    [31, 7, 9, 8, 6, 7],
    [35, 7, 9, 8, 6, 7],
    [36, 8, 10, 9, 7, 8],
  ])('CON+SIZ %i', (sum, head, chest, abdomen, arm, leg) => {
    expect(attrs({ CON: Math.ceil(sum / 2), SIZ: Math.floor(sum / 2) }).hitPoints).toEqual({
      head,
      chest,
      abdomen,
      leftArm: arm,
      rightArm: arm,
      leftLeg: leg,
      rightLeg: leg,
    })
  })
})

describe('other attributes', () => {
  test('Initiative is the average of INT and DEX, rounded up (R1)', () => {
    expect(attrs({ INT: 14, DEX: 16 }).initiative).toBe(15)
    expect(attrs({ INT: 14, DEX: 15 }).initiative).toBe(15)
    expect(attrs({ INT: 13, DEX: 16 }).initiative).toBe(15)
  })

  test('Magic Points equal POW; Movement is 6', () => {
    expect(attrs({ POW: 13 }).magicPoints).toBe(13)
    expect(attrs({}).movement).toBe(6)
  })
})

describe('height and weight', () => {
  test('ranges by SIZ and frame', () => {
    expect(heightWeightRange(8, 'heavy')).toEqual({ heightCm: [151, 155], weightKg: [64, 72] })
    expect(heightWeightRange(18, 'medium')).toEqual({ heightCm: [201, 205], weightKg: [120, 126] })
  })

  test('a roll lands in the range', () => {
    const rng = seededRng(3)
    for (let i = 0; i < 200; i++) {
      const { heightCm, weightKg } = rollHeightWeight(10, 'lithe', rng)
      expect(heightCm).toBeGreaterThanOrEqual(161)
      expect(heightCm).toBeLessThanOrEqual(165)
      expect(weightKg).toBeGreaterThanOrEqual(46)
      expect(weightKg).toBeLessThanOrEqual(50)
    }
  })
})
