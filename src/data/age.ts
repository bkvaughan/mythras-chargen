import type { Characteristic, Dice } from './types.ts'

export type AgeCategory = 'young' | 'adult' | 'middleAged' | 'senior' | 'old'

export interface AgeCategoryDef {
  category: AgeCategory
  name: string
  ageDice: Dice
  bonusSkillPoints: number
  maxSkillIncrease: number
  /** Total number of background events (R12). */
  backgroundEvents: number
}

// Age table, p. 33.
export const AGE_CATEGORIES: AgeCategoryDef[] = [
  { category: 'young', name: 'Young', ageDice: '1d6+10', bonusSkillPoints: 100, maxSkillIncrease: 10, backgroundEvents: 0 },
  { category: 'adult', name: 'Adult', ageDice: '2d6+15', bonusSkillPoints: 150, maxSkillIncrease: 15, backgroundEvents: 1 },
  { category: 'middleAged', name: 'Middle Aged', ageDice: '3d6+25', bonusSkillPoints: 200, maxSkillIncrease: 20, backgroundEvents: 2 },
  { category: 'senior', name: 'Senior', ageDice: '4d6+40', bonusSkillPoints: 250, maxSkillIncrease: 25, backgroundEvents: 3 },
  { category: 'old', name: 'Old', ageDice: '5d6+60', bonusSkillPoints: 300, maxSkillIncrease: 30, backgroundEvents: 4 },
]

export type DifficultyGrade = 'veryEasy' | 'easy' | 'standard' | 'hard' | 'formidable' | 'herculean' | 'hopeless'

/**
 * `{ add, den }`: the skill changes by add × skill/den, that fraction rounded up first (R22).
 * `{ divideBy }`: the skill becomes skill/divideBy, rounded up.
 * null: no attempt can be made, so the roll always fails.
 */
export type GradeEffect = { add: number; den: number } | { divideBy: number } | null

// Difficulty Grade table, p. 39. Automatic is omitted (no roll).
export const DIFFICULTY_GRADES: Record<DifficultyGrade, { name: string; effect: GradeEffect }> = {
  veryEasy: { name: 'Very Easy', effect: { add: 1, den: 1 } },
  easy: { name: 'Easy', effect: { add: 1, den: 2 } },
  standard: { name: 'Standard', effect: { add: 0, den: 1 } },
  hard: { name: 'Hard', effect: { add: -1, den: 3 } },
  formidable: { name: 'Formidable', effect: { add: -1, den: 2 } },
  herculean: { name: 'Herculean', effect: { divideBy: 10 } },
  hopeless: { name: 'Hopeless', effect: null },
}

// Ageing Age Bands, p. 72. Each band passed calls for an Endurance and a Willpower roll at its grade (R17).
export const AGEING_BANDS: { name: string; fromAge: number; grade: DifficultyGrade }[] = [
  { name: 'Early Middle Age', fromAge: 40, grade: 'easy' },
  { name: 'Middle Age', fromAge: 50, grade: 'standard' },
  { name: 'Late Middle Age', fromAge: 60, grade: 'hard' },
  { name: 'Old Age', fromAge: 70, grade: 'formidable' },
  { name: 'Advanced Old Age', fromAge: 80, grade: 'herculean' },
  { name: 'Dotage', fromAge: 90, grade: 'hopeless' },
]

// Ageing Effects table, p. 72: on a failed roll, 1d6 picks the characteristic, which loses 1d3.
export const AGEING_EFFECTS = {
  lossDice: '1d3' as Dice,
  /** Failed Endurance roll, indexed by 1d6 result: 1-2, 3-4, 5-6. */
  physical: [
    { min: 1, max: 2, result: 'STR' },
    { min: 3, max: 4, result: 'CON' },
    { min: 5, max: 6, result: 'DEX' },
  ] satisfies { min: number; max: number; result: Characteristic }[],
  /** Failed Willpower roll. */
  mental: [
    { min: 1, max: 2, result: 'INT' },
    { min: 3, max: 4, result: 'POW' },
    { min: 5, max: 6, result: 'CHA' },
  ] satisfies { min: number; max: number; result: Characteristic }[],
}
