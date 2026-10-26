import type { Characteristic, Dice } from './types.ts'

export const CHARACTERISTICS: readonly Characteristic[] = ['STR', 'CON', 'SIZ', 'DEX', 'INT', 'POW', 'CHA']

export const CHARACTERISTIC_NAMES: Record<Characteristic, string> = {
  STR: 'Strength',
  CON: 'Constitution',
  SIZ: 'Size',
  DEX: 'Dexterity',
  INT: 'Intelligence',
  POW: 'Power',
  CHA: 'Charisma',
}

export type GenerationMethod = 'rollInOrder' | 'rollAndAssign' | 'pointsBuild'

// Human dice, p. 9. Roll and assign swaps only within a group (R2).
export const CHARACTERISTIC_DICE: Record<Characteristic, Dice> = {
  STR: '3d6',
  CON: '3d6',
  SIZ: '2d6+6',
  DEX: '3d6',
  INT: '2d6+6',
  POW: '3d6',
  CHA: '3d6',
}

// Points build, p. 9 and the p. 36 summary (R3; p. 37's minimum of 6 is an erratum).
export const POINTS_BUILD = {
  pool: 75,
  min: { STR: 3, CON: 3, SIZ: 8, DEX: 3, INT: 8, POW: 3, CHA: 3 } satisfies Record<Characteristic, number>,
  max: 18,
}
