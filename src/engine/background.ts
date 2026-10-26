import { AGE_CATEGORIES, type AgeCategory } from '../data/age.ts'
import { BACKGROUND_EVENTS } from '../data/backgroundEvents.ts'
import { CULTURES } from '../data/cultures.ts'
import { CONNECTION_KIND, CONNECTIONS, EXTENDED_FAMILY, MARRIAGE, REPUTATION, SIBLINGS, type ConnectionKind } from '../data/family.ts'
import { SOCIAL_CLASSES, type SocialClass } from '../data/socialClass.ts'
import type { CultureId, Dice } from '../data/types.ts'
import { ageCategory } from './bonus.ts'
import { diceRange, lookupRow, roll, rollD100, type Rng } from './dice.ts'
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

/** Rolls one event, re-rolling any repeat of the events already held (p. 18). */
export function rollBackgroundEvent(held: number[], rng: Rng): number {
  for (;;) {
    const d100 = rollD100(rng)
    if (!held.some((r) => backgroundEvent(r) === backgroundEvent(d100))) return d100
  }
}

/** Rolls the age category's number of events, without repeats (p. 18, R12). */
export function rollBackgroundEvents(category: AgeCategory, rng: Rng): number[] {
  const rolls: number[] = []
  while (rolls.length < ageCategory(category).backgroundEvents) rolls.push(rollBackgroundEvent(rolls, rng))
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

/**
 * The Allies, Contacts, Enemies and Rivals that reputation and connections grant, p. 26.
 * Reputation's "X or Y" label is picked at random; the player may relabel it (R18).
 */
export function rollPeople(reputationRoll: number | null, connectionsRoll: number | null, rng: Rng): ConnectionKind[] {
  const people: ConnectionKind[] = []
  const reputation = reputationRoll === null ? null : lookupRow(REPUTATION, reputationRoll).connections
  if (reputation) {
    const count = roll(reputation.count, rng)
    for (let i = 0; i < count; i++) people.push(reputation.kinds[roll('1d2', rng) - 1])
  }
  const rolls = connectionsRoll === null ? 0 : lookupRow(CONNECTIONS, connectionsRoll).rolls
  for (let i = 0; i < rolls; i++) people.push(connectionKind(roll('1d4', rng)))
  return people
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

/** Ages of a married character's children: 1d4-1 of them (R21). */
export function rollChildren(parent: AgeCategory, rng: Rng): number[] {
  return Array.from({ length: roll(MARRIAGE.children, rng) }, () => roll(childAgeDice(parent), rng))
}

export interface FamilyCounts {
  siblingsRoll: number | null
  siblings: number | null
  extendedFamilyRoll: number | null
  grandparents: number | null
  auntsAndUncles: number | null
  cousins: number | null
}

const EXTENDED_LABELS = { grandparents: 'Grandparents', auntsAndUncles: 'Aunts and uncles', cousins: 'Cousins' } as const

/** Family is optional (R23), but a count that is entered must fit its table row's dice. */
export function familyProblems(f: FamilyCounts, parent: AgeCategory, children: number[]): string[] {
  const problems: string[] = []
  const check = (label: string, value: number | null, dice: Dice | null) => {
    if (value === null) return
    const range = dice === null ? { min: 0, max: 0 } : diceRange(dice)
    if (value < range.min || value > range.max) {
      problems.push(dice === null ? `${label}: the family roll gives none` : `${label} must be ${range.min}-${range.max} on ${dice}`)
    }
  }
  if (f.siblingsRoll !== null) check('Siblings', f.siblings, lookupRow(SIBLINGS, f.siblingsRoll))
  if (f.extendedFamilyRoll !== null) {
    const extended = lookupRow(EXTENDED_FAMILY, f.extendedFamilyRoll)
    for (const key of Object.keys(EXTENDED_LABELS) as (keyof typeof EXTENDED_LABELS)[]) check(EXTENDED_LABELS[key], f[key], extended[key])
  }

  const count = diceRange(MARRIAGE.children)
  if (children.length > count.max) problems.push(`At most ${count.max} children on ${MARRIAGE.children}`)
  const age = diceRange(childAgeDice(parent))
  if (children.some((a) => a < age.min || a > age.max)) problems.push(`Each child's age must be ${age.min}-${age.max} on ${childAgeDice(parent)}`)
  return problems
}
