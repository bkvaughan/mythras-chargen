import type { Bracket } from './types.ts'

// Each table's "each N further points" row is omitted: human characteristics
// never exceed 18, so the last listed bracket already covers every human value.

// Action Points by INT+DEX, p. 9.
export const ACTION_POINTS: Bracket<number>[] = [
  { upTo: 12, value: 1 },
  { upTo: 24, value: 2 },
  { upTo: 36, value: 3 },
]

// Damage Modifier by STR+SIZ, p. 10.
export const DAMAGE_MODIFIER: Bracket<string>[] = [
  { upTo: 5, value: '-1d8' },
  { upTo: 10, value: '-1d6' },
  { upTo: 15, value: '-1d4' },
  { upTo: 20, value: '-1d2' },
  { upTo: 25, value: '+0' },
  { upTo: 30, value: '+1d2' },
  { upTo: 35, value: '+1d4' },
  { upTo: 40, value: '+1d6' },
  { upTo: 45, value: '+1d8' },
  { upTo: 50, value: '+1d10' },
  { upTo: 60, value: '+1d12' },
  { upTo: 70, value: '+2d6' },
  { upTo: 80, value: '+1d8+1d6' },
  { upTo: 90, value: '+2d8' },
  { upTo: 100, value: '+1d10+1d8' },
  { upTo: 110, value: '+2d10' },
  { upTo: 120, value: '+2d10+1d2' },
  { upTo: 130, value: '+2d10+1d4' },
]

// Experience Modifier by CHA, p. 10.
export const EXPERIENCE_MODIFIER: Bracket<number>[] = [
  { upTo: 6, value: -1 },
  { upTo: 12, value: 0 },
  { upTo: 18, value: 1 },
]

// Healing Rate by CON, p. 10.
export const HEALING_RATE: Bracket<number>[] = [
  { upTo: 6, value: 1 },
  { upTo: 12, value: 2 },
  { upTo: 18, value: 3 },
]

// Luck Points by POW, p. 11.
export const LUCK_POINTS: Bracket<number>[] = [
  { upTo: 6, value: 1 },
  { upTo: 12, value: 2 },
  { upTo: 18, value: 3 },
]

// Movement Rate for humans in metres, p. 12. Magic Points equal POW, p. 11.
export const MOVEMENT_RATE = 6

export type HitLocation = 'head' | 'chest' | 'abdomen' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg'

// Hit location d20 ranges, from the character sheet shown on p. 36.
export const HIT_LOCATIONS: { location: HitLocation; name: string; min: number; max: number }[] = [
  { location: 'rightLeg', name: 'Right Leg', min: 1, max: 3 },
  { location: 'leftLeg', name: 'Left Leg', min: 4, max: 6 },
  { location: 'abdomen', name: 'Abdomen', min: 7, max: 9 },
  { location: 'chest', name: 'Chest', min: 10, max: 12 },
  { location: 'rightArm', name: 'Right Arm', min: 13, max: 15 },
  { location: 'leftArm', name: 'Left Arm', min: 16, max: 18 },
  { location: 'head', name: 'Head', min: 19, max: 20 },
]

export interface LocationHitPoints {
  head: number
  chest: number
  abdomen: number
  arm: number
  leg: number
}

// Hit Points per location by CON+SIZ, p. 11.
export const HIT_POINTS: Bracket<LocationHitPoints>[] = [
  { upTo: 5, value: { head: 1, chest: 3, abdomen: 2, arm: 1, leg: 1 } },
  { upTo: 10, value: { head: 2, chest: 4, abdomen: 3, arm: 1, leg: 2 } },
  { upTo: 15, value: { head: 3, chest: 5, abdomen: 4, arm: 2, leg: 3 } },
  { upTo: 20, value: { head: 4, chest: 6, abdomen: 5, arm: 3, leg: 4 } },
  { upTo: 25, value: { head: 5, chest: 7, abdomen: 6, arm: 4, leg: 5 } },
  { upTo: 30, value: { head: 6, chest: 8, abdomen: 7, arm: 5, leg: 6 } },
  { upTo: 35, value: { head: 7, chest: 9, abdomen: 8, arm: 6, leg: 7 } },
  { upTo: 40, value: { head: 8, chest: 10, abdomen: 9, arm: 7, leg: 8 } },
]

export type Frame = 'lithe' | 'medium' | 'heavy'

export interface HeightWeightRow {
  siz: number
  heightCm: [number, number]
  weightKg: Record<Frame, [number, number]>
}

const row = (
  siz: number,
  height: [number, number],
  lithe: [number, number],
  medium: [number, number],
  heavy: [number, number],
): HeightWeightRow => ({ siz, heightCm: height, weightKg: { lithe, medium, heavy } })

// Height and weight by SIZ and frame, p. 10.
export const HEIGHT_WEIGHT: HeightWeightRow[] = [
  row(1, [1, 45], [1, 5], [1, 7], [1, 9]),
  row(2, [46, 80], [6, 10], [8, 14], [10, 18]),
  row(3, [81, 105], [11, 15], [15, 21], [19, 27]),
  row(4, [106, 120], [16, 20], [22, 28], [28, 36]),
  row(5, [121, 130], [21, 25], [29, 35], [37, 45]),
  row(6, [131, 140], [26, 30], [36, 42], [46, 54]),
  row(7, [141, 150], [31, 35], [43, 49], [55, 63]),
  row(8, [151, 155], [36, 40], [50, 56], [64, 72]),
  row(9, [156, 160], [41, 45], [57, 63], [73, 81]),
  row(10, [161, 165], [46, 50], [64, 70], [82, 90]),
  row(11, [166, 170], [51, 55], [71, 77], [91, 99]),
  row(12, [171, 175], [56, 60], [78, 84], [100, 108]),
  row(13, [176, 180], [61, 65], [85, 91], [109, 117]),
  row(14, [181, 185], [66, 70], [92, 98], [118, 126]),
  row(15, [186, 190], [71, 75], [99, 105], [127, 135]),
  row(16, [191, 195], [76, 80], [106, 112], [136, 144]),
  row(17, [196, 200], [81, 85], [113, 119], [145, 153]),
  row(18, [201, 205], [86, 90], [120, 126], [154, 162]),
  row(19, [206, 210], [91, 95], [127, 133], [163, 171]),
  row(20, [211, 215], [96, 100], [134, 140], [172, 180]),
  row(21, [216, 220], [101, 105], [141, 147], [181, 189]),
]
