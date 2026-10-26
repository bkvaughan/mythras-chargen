import { CAREER_ALLOCATION } from '../data/careers.ts'
import { CHARACTERISTICS } from '../data/characteristics.ts'
import { CULTURE_ALLOCATION } from '../data/cultures.ts'
import type { SocialClass } from '../data/socialClass.ts'
import { ageingBands, resolveAgeing, type AgeingResult } from '../engine/ageing.ts'
import { deriveAttributes, type Attributes } from '../engine/attributes.ts'
import { backgroundProblems, socialClass, startingMoney } from '../engine/background.ts'
import { ageCategory, bonusProblems } from '../engine/bonus.ts'
import { careerProblems } from '../engine/career.ts'
import { assignmentProblems, pointsBuildProblems, rolledProblems, withModifiers } from '../engine/characteristics.ts'
import { ageProblems, heightWeightProblems } from '../engine/concept.ts'
import { cultureProblems } from '../engine/culture.ts'
import { passionValue } from '../engine/passions.ts'
import { skillTable, type SkillRow } from '../engine/skills.ts'
import type { Allocation, Characteristics, PassionChoice } from '../engine/types.ts'
import type { Character } from './character.ts'
import { skillChoices } from './reducer.ts'

export const STEPS = ['concept', 'characteristics', 'attributes', 'culture', 'background', 'career', 'bonus', 'ageing'] as const
export type StepId = (typeof STEPS)[number]

export interface StepStatus {
  /** False for the Ageing step of a character under 40. */
  applies: boolean
  complete: boolean
  problems: string[]
}

export interface DerivedCharacter {
  /** Characteristics after Ageing losses; null until set. */
  characteristics: Characteristics | null
  attributes: Attributes | null
  skills: SkillRow[]
  passions: { passion: PassionChoice; value: number | null }[]
  socialClass: SocialClass | null
  money: number | null
  ageing: AgeingResult | null
  pointsRemaining: { culture: number | null; career: number | null; bonus: number | null }
  steps: Record<StepId, StepStatus>
}

const spent = (points: Allocation) => Object.values(points).reduce((sum, v) => sum + v, 0)
const status = (problems: string[], applies = true): StepStatus => ({ applies, complete: problems.length === 0, problems })

function characteristicsProblems(c: Character): string[] {
  const { method } = c.concept
  const { rolled, values } = c.characteristics
  if (!method) return ['Choose how to generate characteristics in the Concept step']
  if (!values) return [method === 'pointsBuild' ? 'Spend the characteristic points' : 'Roll the characteristics']
  if (method === 'pointsBuild') return pointsBuildProblems(values)
  if (!rolled) return ['Roll the characteristics']
  if (rolledProblems(rolled).length > 0) return rolledProblems(rolled)
  if (method === 'rollAndAssign') return assignmentProblems(rolled, values)
  return CHARACTERISTICS.every((k) => rolled[k] === values[k]) ? [] : ['Rolled in order, the characteristics cannot be changed']
}

/** Everything the UI displays, derived from the player's choices by the engine. */
export function deriveCharacter(c: Character): DerivedCharacter {
  const choices = skillChoices(c)
  const characteristicsIssues = characteristicsProblems(c)
  // Nothing is derived from characteristics until they are legal, so lookups never leave their tables.
  const base = characteristicsIssues.length === 0 ? c.characteristics.values : null
  const age = c.concept.age
  const ageingApplies = age !== null && ageingBands(age).length > 0

  const ageing = base && ageingApplies ? resolveAgeing(base, choices, age, c.ageing) : null
  const characteristics = base && withModifiers(base, ageing?.modifiers ?? {})
  const culture = c.culture?.culture ?? null
  const { socialClassRoll, moneyRoll } = c.background

  return {
    characteristics,
    attributes: characteristics && deriveAttributes(characteristics),
    skills: characteristics ? skillTable(characteristics, choices) : [],
    passions: [...(c.culture?.passions ?? []), ...c.background.passions].map((passion) => ({
      passion,
      value: characteristics && passionValue(passion, characteristics),
    })),
    socialClass: culture && socialClassRoll !== null ? socialClass(culture, socialClassRoll) : null,
    money: culture && socialClassRoll !== null && moneyRoll !== null ? startingMoney(culture, moneyRoll, socialClassRoll) : null,
    ageing,
    pointsRemaining: {
      culture: c.culture && CULTURE_ALLOCATION.pool - spent(c.culture.points),
      career: c.career && CAREER_ALLOCATION.pool - spent(c.career.points),
      bonus: ageCategory(c.concept.ageCategory).bonusSkillPoints - spent(c.bonus?.points ?? {}),
    },
    steps: {
      concept: status([...ageProblems(c.concept.ageCategory, age), ...(c.concept.method ? [] : ['Choose how to generate characteristics'])]),
      characteristics: status(characteristicsIssues),
      attributes: status(
        base
          ? heightWeightProblems(base.SIZ, c.attributes.frame, c.attributes.heightCm, c.attributes.weightKg)
          : ['Set the characteristics first'],
      ),
      culture: status(cultureProblems(c.culture)),
      background: status(
        culture
          ? backgroundProblems({ culture, ageCategory: c.concept.ageCategory, socialClassRoll, moneyRoll, events: c.background.events })
          : ['Choose a culture first'],
      ),
      career: status(careerProblems(c.culture, c.career)),
      bonus: status(bonusProblems(choices, c.concept.ageCategory)),
      ageing: ageingApplies
        ? status(ageing?.problems ?? ['Set the characteristics first'])
        : status([], false),
    },
  }
}
