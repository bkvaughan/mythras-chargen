import { z } from 'zod'
import { AGE_CATEGORIES } from '../data/age.ts'
import { CAREERS } from '../data/careers.ts'
import { CHARACTERISTICS } from '../data/characteristics.ts'
import { CULTURES } from '../data/cultures.ts'
import { PASSION_OBJECTS } from '../data/passions.ts'
import type { AgeCategory } from '../data/age.ts'
import type { PassionObject } from '../data/passions.ts'
import type { CareerId, Characteristic, CultureId } from '../data/types.ts'

// The saved character holds the player's choices only; everything else is derived by
// the engine (CLAUDE.md). The zod schema is the single definition of its shape.

export const SCHEMA_VERSION = 1

const keys = <T extends string>(record: Record<T, unknown>) => Object.keys(record) as [T, ...T[]]

const characteristics = z.object(
  Object.fromEntries(CHARACTERISTICS.map((c) => [c, z.int()])) as Record<Characteristic, z.ZodInt>,
)
const cultureId = z.enum(keys(CULTURES) as [CultureId, ...CultureId[]])
const careerId = z.enum(keys(CAREERS) as [CareerId, ...CareerId[]])
const ageCategory = z.enum(AGE_CATEGORIES.map((a) => a.category) as [AgeCategory, ...AgeCategory[]])
const passionObject = z.enum(keys(PASSION_OBJECTS) as [PassionObject, ...PassionObject[]])

const allocation = z.record(z.string(), z.int())
const d100 = z.int().min(1).max(100)
const skillPick = z.object({ skill: z.string(), specialisation: z.string().optional() })
const combatStyle = z.object({ name: z.string(), weapons: z.string(), trait: z.string().nullable() })
const passion = z.object({
  verb: z.string(),
  subject: z.string(),
  object: passionObject.nullable(),
  subjectPOW: z.int().optional(),
  subjectCHA: z.int().optional(),
})
const ageingRoll = z.object({ d100, effect: z.int().min(1).max(6).optional(), loss: z.int().min(1).max(3).optional() })

export const characterSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  concept: z.object({
    name: z.string(),
    player: z.string(),
    gender: z.string(),
    handedness: z.string(),
    description: z.string(),
    ageCategory,
    age: z.int().nullable(),
    method: z.enum(['rollInOrder', 'rollAndAssign', 'pointsBuild']).nullable(),
  }),
  characteristics: z.object({
    /** The dice results, for the rolling methods. */
    rolled: characteristics.nullable(),
    /** The values in use: as rolled, as assigned, or as built. */
    values: characteristics.nullable(),
  }),
  attributes: z.object({
    frame: z.enum(['lithe', 'medium', 'heavy']).nullable(),
    heightCm: z.int().nullable(),
    weightKg: z.int().nullable(),
  }),
  culture: z
    .object({
      culture: cultureId,
      standardChoice: z.array(z.string()),
      professional: z.array(skillPick),
      combatStyle: combatStyle.nullable(),
      points: allocation,
      passions: z.array(passion),
      nativeTongue: z.string(),
    })
    .nullable(),
  background: z.object({
    socialClassRoll: d100.nullable(),
    moneyRoll: z.int().nullable(),
    /** d100 results; choosing an event stores the first number of its row. */
    events: z.array(d100),
    parentsRoll: d100.nullable(),
    siblingsRoll: d100.nullable(),
    siblings: z.int().nullable(),
    extendedFamilyRoll: d100.nullable(),
    grandparents: z.int().nullable(),
    auntsAndUncles: z.int().nullable(),
    cousins: z.int().nullable(),
    reputationRoll: d100.nullable(),
    connectionsRoll: d100.nullable(),
    /** Allies, Contacts, Enemies and Rivals from reputation and connections, labelled and named by the player (R18). */
    people: z.array(z.object({ kind: z.enum(['Ally', 'Contact', 'Enemy', 'Rival']), name: z.string() })),
    marriageRoll: d100.nullable(),
    /** Ages of the children of a married character (R21). */
    children: z.array(z.int()),
    /** Passions added by hand beyond the three cultural ones (R20). */
    passions: z.array(passion),
  }),
  career: z
    .object({
      career: careerId,
      professional: z.array(skillPick),
      styles: z.array(
        z.discriminatedUnion('use', [z.object({ use: z.literal('cultural') }), z.object({ use: z.literal('new'), style: combatStyle })]),
      ),
      points: allocation,
    })
    .nullable(),
  bonus: z
    .object({
      hobby: z
        .discriminatedUnion('kind', [
          z.object({ kind: z.literal('skill'), pick: skillPick }),
          z.object({ kind: z.literal('style'), style: combatStyle }),
        ])
        .nullable(),
      points: allocation,
    })
    .nullable(),
  ageing: z.array(z.object({ endurance: ageingRoll, willpower: ageingRoll })),
})

export type Character = z.infer<typeof characterSchema>

export function newCharacter(): Character {
  return {
    schemaVersion: SCHEMA_VERSION,
    concept: { name: '', player: '', gender: '', handedness: '', description: '', ageCategory: 'adult', age: null, method: null },
    characteristics: { rolled: null, values: null },
    attributes: { frame: null, heightCm: null, weightKg: null },
    culture: null,
    background: {
      socialClassRoll: null,
      moneyRoll: null,
      events: [],
      parentsRoll: null,
      siblingsRoll: null,
      siblings: null,
      extendedFamilyRoll: null,
      grandparents: null,
      auntsAndUncles: null,
      cousins: null,
      reputationRoll: null,
      connectionsRoll: null,
      people: [],
      marriageRoll: null,
      children: [],
      passions: [],
    },
    career: null,
    bonus: null,
    ageing: [],
  }
}
