import { AGEING_BANDS, AGEING_EFFECTS, DIFFICULTY_GRADES, type DifficultyGrade } from '../data/age.ts'
import { CHARACTERISTICS } from '../data/characteristics.ts'
import type { Characteristic } from '../data/types.ts'
import { lookupRow, roll, rollD100, rollDie, type Rng } from './dice.ts'
import { skillTotal } from './skills.ts'
import type { Characteristics, SkillChoices } from './types.ts'

/** The skill value at a difficulty grade (R22); null when no attempt can be made. */
export function gradedValue(skill: number, grade: DifficultyGrade): number | null {
  const effect = DIFFICULTY_GRADES[grade].effect
  if (effect === null) return null
  if ('divideBy' in effect) return Math.ceil(skill / effect.divideBy)
  return skill + Math.sign(effect.add) * Math.ceil((Math.abs(effect.add) * skill) / effect.den)
}

/** A d100 skill roll: 01-05 always succeeds, 96-00 always fails (p. 38); Hopeless always fails. */
export function rollSucceeds(d100: number, target: number | null): boolean {
  if (target === null) return false
  if (d100 <= 5) return true
  if (d100 >= 96) return false
  return d100 <= target
}

export function ageingBands(age: number) {
  return AGEING_BANDS.filter((b) => age >= b.fromAge)
}

/** One Ageing roll as rolled or entered: the d100, and the 1d6 and 1d3 used only if it fails. */
export interface AgeingRoll {
  d100: number
  effect?: number
  loss?: number
}

export interface AgeingBandRolls {
  endurance: AgeingRoll
  willpower: AgeingRoll
}

export interface AgeingOutcome {
  band: string
  rolls: { skill: 'Endurance' | 'Willpower'; target: number | null; success: boolean; lost?: { characteristic: Characteristic; amount: number } }[]
}

export interface AgeingResult {
  outcomes: AgeingOutcome[]
  /** Characteristic losses as negative modifiers. */
  modifiers: Partial<Characteristics>
  problems: string[]
}

/**
 * Resolves Ageing band by band (R17): each band rolls Endurance then Willpower against the
 * skill totals left by the losses of the bands before it.
 */
export function resolveAgeing(c: Characteristics, choices: SkillChoices, age: number, rolls: AgeingBandRolls[]): AgeingResult {
  const bands = ageingBands(age)
  const problems: string[] = []
  if (rolls.length !== bands.length) problems.push(`Make the Ageing rolls for ${bands.length} age bands`)

  const current = { ...c }
  const modifiers: Partial<Characteristics> = {}
  const outcomes: AgeingOutcome[] = []

  bands.slice(0, rolls.length).forEach((band, i) => {
    const outcome: AgeingOutcome = { band: band.name, rolls: [] }
    for (const [skill, table, entry] of [
      ['Endurance', AGEING_EFFECTS.physical, rolls[i].endurance],
      ['Willpower', AGEING_EFFECTS.mental, rolls[i].willpower],
    ] as const) {
      const target = gradedValue(skillTotal(current, choices, skill), band.grade)
      const success = rollSucceeds(entry.d100, target)
      if (success) {
        outcome.rolls.push({ skill, target, success })
        continue
      }
      if (entry.effect === undefined || entry.loss === undefined) {
        problems.push(`${band.name}: enter the ${skill} Ageing effect and loss`)
        outcome.rolls.push({ skill, target, success })
        continue
      }
      const characteristic = lookupRow(table, entry.effect)
      current[characteristic] -= entry.loss
      modifiers[characteristic] = (modifiers[characteristic] ?? 0) - entry.loss
      outcome.rolls.push({ skill, target, success, lost: { characteristic, amount: entry.loss } })
    }
    outcomes.push(outcome)
  })

  // The book says a characteristic reduced to zero by Ageing kills the character (R17).
  for (const ch of CHARACTERISTICS) {
    if (current[ch] <= 0) problems.push(`Ageing has reduced ${ch} to ${current[ch]}; re-roll or edit the Ageing results`)
  }
  return { outcomes, modifiers, problems }
}

export function rollAgeing(age: number, rng: Rng): AgeingBandRolls[] {
  const one = (): AgeingRoll => ({ d100: rollD100(rng), effect: rollDie(6, rng), loss: roll(AGEING_EFFECTS.lossDice, rng) })
  return ageingBands(age).map(() => ({ endurance: one(), willpower: one() }))
}
