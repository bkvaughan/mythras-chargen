import { AGE_CATEGORIES, type AgeCategory } from '../data/age.ts'
import { BACKGROUND_EVENTS } from '../data/backgroundEvents.ts'
import { CULTURES } from '../data/cultures.ts'
import { CONNECTION_KIND, MARRIAGE, type ConnectionKind } from '../data/family.ts'
import { SOCIAL_CLASSES, type SocialClass } from '../data/socialClass.ts'
import type { CultureId, Dice } from '../data/types.ts'
import { ageCategory } from './bonus.ts'
import { diceRange, lookupRow, rollD100, type Rng } from './dice.ts'
import { baseValue, findSkill } from './skills.ts'
import type { Characteristics } from './types.ts'

export function socialClass(culture: CultureId, d100: number): SocialClass {
  return lookupRow(SOCIAL_CLASSES[culture], d100)
}

/** Culture base money (the rolled 4d6 × multiplier) × social class Money Modifier, in SP (R14, R1). */
export function startingMoney(culture: CultureId, moneyRoll: number, socialClassRoll: number): number {
  const { multiplier } = CULTURES[culture].startingMoney
  return Math.ceil(moneyRoll * multiplier * socialClass(culture, socialClassRoll).moneyModifier)
}

/** The table row an event roll lands on; two rolls on the same row are the same event. */
export function backgroundEvent(d100: number) {
  return BACKGROUND_EVENTS.find((r) => d100 >= r.min && d100 <= r.max)!
}

/** Rolls the age category's number of events, re-rolling any repeat (p. 18, R12). */
export function rollBackgroundEvents(category: AgeCategory, rng: Rng): number[] {
  const rolls: number[] = []
  while (rolls.length < ageCategory(category).backgroundEvents) {
    const d100 = rollD100(rng)
    if (!rolls.some((r) => backgroundEvent(r) === backgroundEvent(d100))) rolls.push(d100)
  }
  return rolls
}

export interface BackgroundRequired {
  culture: CultureId
  ageCategory: AgeCategory
  socialClassRoll: number | null
  moneyRoll: number | null
  events: number[]
}

/** Only social class, money and background events are required (R23). */
export function backgroundProblems(b: BackgroundRequired): string[] {
  const problems: string[] = []
  if (b.socialClassRoll === null) problems.push('Roll or choose a social class')
  const money = diceRange(CULTURES[b.culture].startingMoney.dice)
  if (b.moneyRoll === null || b.moneyRoll < money.min || b.moneyRoll > money.max) {
    problems.push(`Roll or enter starting money (${money.min}-${money.max} on ${CULTURES[b.culture].startingMoney.dice})`)
  }
  const count = ageCategory(b.ageCategory).backgroundEvents
  if (b.events.length !== count) problems.push(`Choose ${count} background event${count === 1 ? '' : 's'} (${b.events.length} chosen)`)
  const rows = b.events.map(backgroundEvent)
  if (new Set(rows).size !== rows.length) problems.push('Each background event can be taken only once')
  return problems
}

export function connectionKind(d4: number): ConnectionKind {
  return CONNECTION_KIND.find((k) => k.roll === d4)!.kind
}

export type MaritalStatus = 'married' | 'betrothed' | 'unmarried'

/** p. 24: at or under a tenth of base Influence (rounded up, R1) is married; at or under base Influence, betrothed. */
export function maritalStatus(d100: number, c: Characteristics): MaritalStatus {
  const baseInfluence = baseValue(findSkill('Influence')!.base, c)
  if (d100 <= Math.ceil(baseInfluence * MARRIAGE.marriedFraction)) return 'married'
  if (d100 <= baseInfluence) return 'betrothed'
  return 'unmarried'
}

/** Dice for a child's age (R21): 1d4 for Young or Adult parents, else the next-younger category's dice. */
export function childAgeDice(parent: AgeCategory): Dice {
  const i = AGE_CATEGORIES.findIndex((a) => a.category === parent)
  return i <= 1 ? MARRIAGE.childAge : AGE_CATEGORIES[i - 1].ageDice
}
