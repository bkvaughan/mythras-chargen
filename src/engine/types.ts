import type { CareerId, Characteristic, CultureId } from '../data/types.ts'
import type { PassionObject } from '../data/passions.ts'

// The player's choices that the engine validates and derives from. The saved
// Character (src/state) is built from these.

export type Characteristics = Record<Characteristic, number>

/** Points spent per skill key at one stage, e.g. { 'Lore (Geography)': 10 }. */
export type Allocation = Record<string, number>

export interface SkillPick {
  skill: string
  specialisation?: string
}

export interface CombatStyle {
  name: string
  weapons: string
  trait: string | null
}

export interface PassionChoice {
  verb: string
  subject: string
  object: PassionObject | null
  /** The subject's characteristics where the formula needs them; default to the character's own (R13). */
  subjectPOW?: number
  subjectCHA?: number
}

export interface CultureChoices {
  culture: CultureId
  standardChoice: string[]
  professional: SkillPick[]
  combatStyle: CombatStyle | null
  points: Allocation
  passions: PassionChoice[]
}

/** One per career combat style slot (R9). */
export type SlotChoice = { use: 'cultural' } | { use: 'new'; style: CombatStyle }

export interface CareerChoices {
  career: CareerId
  professional: SkillPick[]
  styles: SlotChoice[]
  points: Allocation
}

export type Hobby = { kind: 'skill'; pick: SkillPick } | { kind: 'style'; style: CombatStyle }

export interface BonusChoices {
  hobby: Hobby | null
  points: Allocation
}

export interface SkillChoices {
  culture: CultureChoices | null
  career: CareerChoices | null
  bonus: BonusChoices | null
}
