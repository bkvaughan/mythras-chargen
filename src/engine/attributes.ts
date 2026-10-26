import {
  ACTION_POINTS,
  DAMAGE_MODIFIER,
  EXPERIENCE_MODIFIER,
  HEALING_RATE,
  HEIGHT_WEIGHT,
  HIT_LOCATIONS,
  HIT_POINTS,
  LUCK_POINTS,
  MOVEMENT_RATE,
  type Frame,
  type HitLocation,
  type LocationHitPoints,
} from '../data/attributes.ts'
import { lookupBracket, rollBetween, type Rng } from './dice.ts'
import type { Characteristics } from './types.ts'

export interface Attributes {
  actionPoints: number
  damageModifier: string
  experienceModifier: number
  healingRate: number
  initiative: number
  luckPoints: number
  magicPoints: number
  movement: number
  hitPoints: Record<HitLocation, number>
}

// The Hit Points table gives one column for both arms and one for both legs.
const HIT_POINTS_COLUMN: Record<HitLocation, keyof LocationHitPoints> = {
  head: 'head',
  chest: 'chest',
  abdomen: 'abdomen',
  leftArm: 'arm',
  rightArm: 'arm',
  leftLeg: 'leg',
  rightLeg: 'leg',
}

export function deriveAttributes(c: Characteristics): Attributes {
  const hp = lookupBracket(HIT_POINTS, c.CON + c.SIZ)
  const hitPoints = {} as Record<HitLocation, number>
  for (const { location } of HIT_LOCATIONS) hitPoints[location] = hp[HIT_POINTS_COLUMN[location]]
  return {
    actionPoints: lookupBracket(ACTION_POINTS, c.INT + c.DEX),
    damageModifier: lookupBracket(DAMAGE_MODIFIER, c.STR + c.SIZ),
    experienceModifier: lookupBracket(EXPERIENCE_MODIFIER, c.CHA),
    healingRate: lookupBracket(HEALING_RATE, c.CON),
    // Average of INT and DEX, rounded up (R1).
    initiative: Math.ceil((c.INT + c.DEX) / 2),
    luckPoints: lookupBracket(LUCK_POINTS, c.POW),
    magicPoints: c.POW,
    movement: MOVEMENT_RATE,
    hitPoints,
  }
}

export interface HeightWeightRange {
  heightCm: [number, number]
  weightKg: [number, number]
}

export function heightWeightRange(siz: number, frame: Frame): HeightWeightRange {
  const row = HEIGHT_WEIGHT.find((r) => r.siz === siz)
  if (!row) throw new Error(`No height and weight for SIZ ${siz}`)
  return { heightCm: row.heightCm, weightKg: row.weightKg[frame] }
}

export function rollHeightWeight(siz: number, frame: Frame, rng: Rng): { heightCm: number; weightKg: number } {
  const range = heightWeightRange(siz, frame)
  return {
    heightCm: rollBetween(...range.heightCm, rng),
    weightKg: rollBetween(...range.weightKg, rng),
  }
}
