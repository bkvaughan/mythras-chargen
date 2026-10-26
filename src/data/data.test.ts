import { describe, expect, test } from 'vitest'
import { AGE_CATEGORIES, AGEING_BANDS, AGEING_EFFECTS } from './age.ts'
import {
  ACTION_POINTS,
  DAMAGE_MODIFIER,
  EXPERIENCE_MODIFIER,
  HEALING_RATE,
  HEIGHT_WEIGHT,
  HIT_LOCATIONS,
  HIT_POINTS,
  LUCK_POINTS,
} from './attributes.ts'
import { BACKGROUND_EVENTS } from './backgroundEvents.ts'
import { CAREERS } from './careers.ts'
import { COMBAT_STYLE_TRAITS, SAMPLE_COMBAT_STYLES } from './combatStyles.ts'
import { CULTURES } from './cultures.ts'
import { CONNECTIONS, EXTENDED_FAMILY, PARENTS, REPUTATION, SIBLINGS } from './family.ts'
import { ALL_SKILLS, PROFESSIONAL_SKILLS, STANDARD_SKILLS } from './skills.ts'
import { SOCIAL_CLASSES } from './socialClass.ts'
import type { Bracket, Characteristic, CultureId, D100Row } from './types.ts'

const skill = (name: string) => ALL_SKILLS.find((s) => s.name === name)
const cultures = Object.values(CULTURES)
const careers = Object.values(CAREERS)

/** True when the rows cover from..to in order, each value exactly once. */
function coversExactly(rows: { min: number; max: number }[], from: number, to: number) {
  let next = from
  for (const row of rows) {
    if (row.min !== next || row.max < row.min) return false
    next = row.max + 1
  }
  return next === to + 1
}

describe('counts', () => {
  test('22 standard skills, 36 professional skills', () => {
    expect(STANDARD_SKILLS).toHaveLength(22)
    expect(PROFESSIONAL_SKILLS).toHaveLength(36)
    expect(new Set(ALL_SKILLS.map((s) => s.name)).size).toBe(ALL_SKILLS.length)
  })

  test('4 cultures, 24 careers, 26 combat style traits', () => {
    expect(cultures).toHaveLength(4)
    expect(careers).toHaveLength(24)
    expect(COMBAT_STYLE_TRAITS).toHaveLength(26)
  })

  test('record keys match ids', () => {
    for (const [id, c] of Object.entries(CULTURES)) expect(c.id).toBe(id)
    for (const [id, c] of Object.entries(CAREERS)) expect(c.id).toBe(id)
  })
})

describe('skill references', () => {
  test('culture skills exist with the right type', () => {
    for (const c of cultures) {
      for (const name of [...c.standardSkills, ...(c.standardSkillChoice?.options ?? [])]) {
        expect(skill(name)?.type, `${c.name}: ${name}`).toBe('standard')
      }
      for (const ref of c.professionalSkills) {
        expect(skill(ref.skill)?.type, `${c.name}: ${ref.skill}`).toBe('professional')
      }
    }
  })

  test('career skills exist with the right type', () => {
    for (const c of careers) {
      for (const name of c.standardSkills) expect(skill(name)?.type, `${c.name}: ${name}`).toBe('standard')
      for (const ref of c.professionalSkills) {
        expect(skill(ref.skill)?.type, `${c.name}: ${ref.skill}`).toBe('professional')
      }
    }
  })

  test('specialisation hints only appear on specialised skills', () => {
    const refs = [...cultures, ...careers].flatMap((c) => c.professionalSkills)
    for (const ref of refs.filter((r) => r.hint)) expect(skill(ref.skill)?.specialised, ref.skill).toBe(true)
  })

  test('every career offers seven professional skills', () => {
    for (const c of careers) expect(c.professionalSkills, c.name).toHaveLength(7)
  })

  test('sample combat style traits exist', () => {
    const traits = COMBAT_STYLE_TRAITS.map((t) => t.name)
    for (const style of SAMPLE_COMBAT_STYLES) {
      for (const t of style.suggestedTraits) expect(traits, style.name).toContain(t)
    }
  })
})

describe('career availability by culture, p. 27', () => {
  test.each<[CultureId, number]>([
    ['civilised', 24],
    ['barbarian', 19],
    ['nomadic', 15],
    ['primitive', 11],
  ])('%s offers %i careers', (id, count) => {
    expect(new Set(CULTURES[id].careers).size).toBe(count)
  })

  test('only Civilised offers Agent, Alchemist, Courtesan, Courtier and Sorcerer', () => {
    for (const id of ['agent', 'alchemist', 'courtesan', 'courtier', 'sorcerer'] as const) {
      expect(cultures.filter((c) => c.careers.includes(id)).map((c) => c.id)).toEqual(['civilised'])
    }
  })

  test('every culture offers Warrior, Hunter and Shaman', () => {
    for (const c of cultures) expect(c.careers).toEqual(expect.arrayContaining(['warrior', 'hunter', 'shaman']))
  })
})

describe('d100 tables cover 1-100 exactly once', () => {
  const tables: [string, D100Row<unknown>[]][] = [
    ['background events', BACKGROUND_EVENTS],
    ['parents', PARENTS],
    ['siblings', SIBLINGS],
    ['extended family', EXTENDED_FAMILY],
    ['reputation', REPUTATION],
    ['connections', CONNECTIONS],
    ...Object.entries(SOCIAL_CLASSES).map(([id, rows]): [string, D100Row<unknown>[]] => [`social class ${id}`, rows]),
  ]
  test.each(tables)('%s', (_, rows) => expect(coversExactly(rows, 1, 100)).toBe(true))
})

describe('other table coverage', () => {
  test('ageing effects cover 1d6', () => {
    expect(coversExactly(AGEING_EFFECTS.physical, 1, 6)).toBe(true)
    expect(coversExactly(AGEING_EFFECTS.mental, 1, 6)).toBe(true)
  })

  test('hit locations cover 1d20', () => {
    expect(coversExactly(HIT_LOCATIONS, 1, 20)).toBe(true)
  })

  test('height and weight cover SIZ 1-21', () => {
    expect(HEIGHT_WEIGHT.map((r) => r.siz)).toEqual(Array.from({ length: 21 }, (_, i) => i + 1))
  })

  test('ageing bands start at 40 and step by ten years', () => {
    expect(AGEING_BANDS.map((b) => b.fromAge)).toEqual([40, 50, 60, 70, 80, 90])
  })

  test('age categories in order', () => {
    expect(AGE_CATEGORIES.map((a) => a.bonusSkillPoints)).toEqual([100, 150, 200, 250, 300])
  })

  // Highest human sums: INT+DEX, STR+SIZ, CON+SIZ = 36; CON, CHA, POW = 18.
  test.each<[string, Bracket<unknown>[], number]>([
    ['Action Points', ACTION_POINTS, 36],
    ['Damage Modifier', DAMAGE_MODIFIER, 36],
    ['Experience Modifier', EXPERIENCE_MODIFIER, 18],
    ['Healing Rate', HEALING_RATE, 18],
    ['Luck Points', LUCK_POINTS, 18],
    ['Hit Points', HIT_POINTS, 36],
  ])('%s brackets ascend and reach the human maximum', (_, brackets, humanMax) => {
    const ups = brackets.map((b) => b.upTo)
    expect(ups).toEqual([...ups].sort((a, b) => a - b))
    expect(ups.at(-1)).toBeGreaterThanOrEqual(humanMax)
  })
})

describe('base formulas reproduce Anathaym, p. 12', () => {
  const anathaym: Record<Characteristic, number> = { STR: 11, CON: 13, SIZ: 10, DEX: 16, INT: 14, POW: 7, CHA: 9 }
  const printed: Record<string, number> = {
    Athletics: 27,
    Boating: 24,
    Brawn: 21,
    Conceal: 23,
    Customs: 28,
    Dance: 25,
    Deceit: 23,
    Drive: 23,
    Endurance: 26,
    Evade: 32,
    'First Aid': 30,
    Influence: 18,
    Insight: 21,
    Locale: 28,
    'Native Tongue': 23,
    Perception: 21,
    Ride: 23,
    Sing: 16,
    Stealth: 30,
    Swim: 24,
    Unarmed: 27,
    Willpower: 14,
    // Her professional skills, pp. 18 and 28.
    Courtesy: 23,
    Lore: 28,
    Streetwise: 16,
    Survival: 20,
  }
  test.each(Object.entries(printed))('%s %i', (name, value) => {
    const [a, b] = skill(name)!.base
    expect(anathaym[a] + anathaym[b]).toBe(value)
  })
})
