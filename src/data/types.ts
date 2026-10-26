export type Characteristic = 'STR' | 'CON' | 'SIZ' | 'DEX' | 'INT' | 'POW' | 'CHA'

/** A dice expression such as '3d6', '2d6+6' or '1d3-1'. Parsed by the engine. */
export type Dice = string

/** A skill's base is the sum of two characteristics; "INT x2" is ['INT', 'INT']. */
export type BaseFormula = readonly [Characteristic, Characteristic]

export interface SkillDef {
  name: string
  type: 'standard' | 'professional'
  base: BaseFormula
  /** Takes a free-text specialisation, e.g. Craft (Pottery) (R7). */
  specialised: boolean
  magic: boolean
  page: number
}

/**
 * A skill as named by a culture or career. `specialisation` is fixed by the rules
 * (Craft (Alchemy)); `hint` guides a free-text one (Lore (Specific Alchemical Speciality)).
 */
export interface SkillRef {
  skill: string
  specialisation?: string
  hint?: string
}

/** A row of a d100 table; 00 is written as 100. */
export interface D100Row<T> {
  min: number
  max: number
  result: T
}

/** A bracket of an attribute table: applies to values up to and including `upTo`. */
export interface Bracket<T> {
  upTo: number
  value: T
}

export type CultureId = 'barbarian' | 'civilised' | 'nomadic' | 'primitive'

export type CareerId =
  | 'agent'
  | 'alchemist'
  | 'beastHandler'
  | 'courtesan'
  | 'courtier'
  | 'crafter'
  | 'entertainer'
  | 'farmer'
  | 'fisher'
  | 'herder'
  | 'hunter'
  | 'merchant'
  | 'miner'
  | 'mystic'
  | 'official'
  | 'physician'
  | 'priest'
  | 'sailor'
  | 'scholar'
  | 'scout'
  | 'shaman'
  | 'sorcerer'
  | 'thief'
  | 'warrior'

export interface CulturalPassion {
  verb: string
  /** The kind of subject the culture suggests, e.g. 'Clan Chieftain'. */
  subject: string
}

export interface CultureDef {
  id: CultureId
  name: string
  page: number
  standardSkills: string[]
  /** Pick `pick` of these as additional culture standard skills (R6). */
  standardSkillChoice?: { pick: number; options: string[] }
  professionalSkills: SkillRef[]
  combatStyleNames: string[]
  passions: CulturalPassion[]
  startingMoney: { dice: Dice; multiplier: number }
  careers: CareerId[]
}

/**
 * Career combat style slots (R9):
 * - cultural: the style from the culture step
 * - specificOrCultural: the cultural style, or a new career style
 * - new: a new, separate style
 */
export interface CareerStyleSlot {
  kind: 'cultural' | 'specificOrCultural' | 'new'
  label: string
}

export interface CareerDef {
  id: CareerId
  name: string
  page: number
  standardSkills: string[]
  combatStyles: CareerStyleSlot[]
  professionalSkills: SkillRef[]
}
