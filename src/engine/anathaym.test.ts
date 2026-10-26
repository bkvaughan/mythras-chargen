import { describe, expect, test } from 'vitest'
import { deriveAttributes, heightWeightRange } from './attributes.ts'
import { careerProblems } from './career.ts'
import { cultureProblems } from './culture.ts'
import { startingMoney } from './background.ts'
import { skillTable } from './skills.ts'
import { ANATHAYM, ANATHAYM_CAREER, ANATHAYM_CHOICES, ANATHAYM_CULTURE } from './testFixtures.ts'
import type { Characteristics, SkillChoices } from './types.ts'

const totals = (c: Characteristics, choices: SkillChoices) =>
  Object.fromEntries(skillTable(c, choices).map((r) => [r.key, r.total]))

// Standard skills as printed after each stage; Unarmed after career is 37, not the printed 27 (Known errata).
const STANDARD_AFTER_CULTURE = {
  Athletics: 27, Boating: 24, Brawn: 21, Conceal: 28, Customs: 68, Dance: 25, Deceit: 28, Drive: 28,
  Endurance: 26, Evade: 32, 'First Aid': 30, Influence: 28, Insight: 31, Locale: 33, 'Native Tongue': 63,
  Perception: 21, Ride: 23, Sing: 16, Stealth: 30, Swim: 24, Unarmed: 27, Willpower: 24,
}

describe('golden test: Anathaym', () => {
  test('attributes, p. 12', () => {
    expect(deriveAttributes(ANATHAYM)).toEqual({
      actionPoints: 3,
      damageModifier: '+0',
      experienceModifier: 0,
      healingRate: 3,
      initiative: 15,
      luckPoints: 2,
      magicPoints: 7,
      movement: 6,
      hitPoints: { head: 5, chest: 7, abdomen: 6, leftArm: 4, rightArm: 4, leftLeg: 5, rightLeg: 5 },
    })
  })

  test('height and weight range for SIZ 10, lithe, p. 12', () => {
    expect(heightWeightRange(10, 'lithe')).toEqual({ heightCm: [161, 165], weightKg: [46, 50] })
  })

  test('base skills, p. 12', () => {
    expect(totals(ANATHAYM, { culture: null, career: null, bonus: null })).toEqual({
      Athletics: 27, Boating: 24, Brawn: 21, Conceal: 23, Customs: 28, Dance: 25, Deceit: 23, Drive: 23,
      Endurance: 26, Evade: 32, 'First Aid': 30, Influence: 18, Insight: 21, Locale: 28, 'Native Tongue': 23,
      Perception: 21, Ride: 23, Sing: 16, Stealth: 30, Swim: 24, Unarmed: 27, Willpower: 14,
    })
  })

  test('skills after Civilised culture, p. 18', () => {
    expect(cultureProblems(ANATHAYM_CULTURE)).toEqual([])
    expect(totals(ANATHAYM, { culture: ANATHAYM_CULTURE, career: null, bonus: null })).toEqual({
      ...STANDARD_AFTER_CULTURE,
      Courtesy: 38,
      'Lore (Geography)': 38,
      Streetwise: 31,
      'Combat Style (Meerish Slinger)': 37,
    })
  })

  test('skills after the Warrior career, p. 28', () => {
    expect(careerProblems(ANATHAYM_CULTURE, ANATHAYM_CAREER)).toEqual([])
    expect(totals(ANATHAYM, ANATHAYM_CHOICES)).toEqual({
      ...STANDARD_AFTER_CULTURE,
      Athletics: 37,
      Endurance: 36,
      Evade: 42,
      Unarmed: 37,
      Courtesy: 38,
      'Lore (Geography)': 38,
      Streetwise: 31,
      'Lore (Military History)': 38,
      'Lore (Strategy and Tactics)': 38,
      Survival: 30,
      'Combat Style (Meerish Slinger)': 52,
      'Combat Style (Meerish Infantry)': 42,
    })
  })

  test('starting money: 9 on 4d6, Aristocracy (97), p. 22', () => {
    expect(startingMoney('civilised', 9, 97)).toBe(3375)
  })

  test('changing a characteristic changes bases and totals but keeps allocations', () => {
    const stronger = { ...ANATHAYM, STR: 14 }
    const before = skillTable(ANATHAYM, ANATHAYM_CHOICES)
    const after = skillTable(stronger, ANATHAYM_CHOICES)
    const athletics = (rows: typeof before) => rows.find((r) => r.key === 'Athletics')!
    expect(athletics(after).base).toBe(athletics(before).base + 3)
    expect(athletics(after).career).toBe(10)
    expect(athletics(after).total).toBe(40)
    expect(after.find((r) => r.key === 'Combat Style (Meerish Slinger)')!.total).toBe(55)
    expect(after.find((r) => r.key === 'Customs')!.total).toBe(68)
  })
})
