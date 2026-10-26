import type { AgeCategory } from '../data/age.ts'
import type { Frame } from '../data/attributes.ts'
import { heightWeightRange } from './attributes.ts'
import { ageCategory } from './bonus.ts'
import { diceRange } from './dice.ts'

/** Age in years must fall within the category's dice range (R16). */
export function ageProblems(category: AgeCategory, age: number | null): string[] {
  const def = ageCategory(category)
  const range = diceRange(def.ageDice)
  if (age === null || age < range.min || age > range.max) {
    return [`Roll or enter an age between ${range.min} and ${range.max} for the ${def.name} age category`]
  }
  return []
}

export function heightWeightProblems(siz: number, frame: Frame | null, heightCm: number | null, weightKg: number | null): string[] {
  if (!frame) return ['Choose a frame']
  const range = heightWeightRange(siz, frame)
  const problems: string[] = []
  if (heightCm === null || heightCm < range.heightCm[0] || heightCm > range.heightCm[1]) {
    problems.push(`Height must be ${range.heightCm[0]}-${range.heightCm[1]} cm for SIZ ${siz}`)
  }
  if (weightKg === null || weightKg < range.weightKg[0] || weightKg > range.weightKg[1]) {
    problems.push(`Weight must be ${range.weightKg[0]}-${range.weightKg[1]} kg for SIZ ${siz} and a ${frame} frame`)
  }
  return problems
}
