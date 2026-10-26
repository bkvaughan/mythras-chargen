import { CULTURE_ALLOCATION, CULTURES } from '../data/cultures.ts'
import { allocationProblems, pickProblems, skillKey, styleKey, styleProblems } from './skills.ts'
import type { CultureChoices } from './types.ts'

/** Skills that can (and must) receive culture points (R4, R6). */
export function cultureEligibleSkills(choices: CultureChoices): string[] {
  const culture = CULTURES[choices.culture]
  return [
    ...culture.standardSkills,
    ...choices.standardChoice,
    ...choices.professional.map(skillKey),
    ...(choices.combatStyle ? [styleKey(choices.combatStyle)] : []),
  ]
}

export function cultureProblems(choices: CultureChoices | null): string[] {
  if (!choices) return ['Choose a culture']
  const culture = CULTURES[choices.culture]
  const problems: string[] = []

  const group = culture.standardSkillChoice
  if (group) {
    const picked = new Set(choices.standardChoice)
    if (picked.size !== group.pick || choices.standardChoice.length !== group.pick || ![...picked].every((s) => group.options.includes(s))) {
      problems.push(`Choose ${group.pick} of ${group.options.join(', ')}`)
    }
  } else if (choices.standardChoice.length > 0) {
    problems.push(`${culture.name} has no standard skill choice`)
  }

  const { professionalPicks } = CULTURE_ALLOCATION
  if (choices.professional.length !== professionalPicks) {
    problems.push(`Choose ${professionalPicks} professional skills (${choices.professional.length} chosen)`)
  }
  for (const pick of choices.professional) {
    if (!culture.professionalSkills.some((ref) => ref.skill === pick.skill)) {
      problems.push(`${pick.skill} is not a ${culture.name} professional skill`)
    } else {
      problems.push(...pickProblems(pick))
    }
  }
  const keys = choices.professional.map(skillKey)
  if (new Set(keys).size !== keys.length) problems.push('Each professional skill can be chosen only once')

  if (choices.combatStyle) problems.push(...styleProblems(choices.combatStyle))

  problems.push(...allocationProblems(choices.points, cultureEligibleSkills(choices), CULTURE_ALLOCATION, 'culture'))

  // The three cultural Passions are required (R23).
  if (choices.passions.length !== culture.passions.length || choices.passions.some((p) => !p.subject.trim() || !p.object)) {
    problems.push('Name the subject and object type of all three Passions')
  }
  return problems
}
