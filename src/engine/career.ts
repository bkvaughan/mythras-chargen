import { CAREER_ALLOCATION, CAREERS } from '../data/careers.ts'
import { CULTURES } from '../data/cultures.ts'
import type { CareerId, CultureId } from '../data/types.ts'
import { allocationProblems, pickProblems, skillKey, styleKey, styleProblems } from './skills.ts'
import type { CareerChoices, CombatStyle, CultureChoices } from './types.ts'

export function availableCareers(culture: CultureId): CareerId[] {
  return CULTURES[culture].careers
}

/** The style each career slot refers to: the cultural style, or a newly defined one (R9). */
export function careerSlotStyles(culture: CultureChoices, career: CareerChoices): (CombatStyle | null)[] {
  return career.styles.map((s) => (s.use === 'cultural' ? culture.combatStyle : s.style))
}

/** Skills that can receive career points. */
export function careerEligibleSkills(culture: CultureChoices, career: CareerChoices): string[] {
  const styles = careerSlotStyles(culture, career).filter((s) => s !== null)
  return [...CAREERS[career.career].standardSkills, ...career.professional.map(skillKey), ...styles.map(styleKey)]
}

export function careerProblems(culture: CultureChoices | null, career: CareerChoices | null): string[] {
  if (!culture) return ['Choose a culture first']
  if (!career) return ['Choose a career']
  const def = CAREERS[career.career]
  const problems: string[] = []

  if (!availableCareers(culture.culture).includes(career.career)) {
    problems.push(`${def.name} is not available to a ${CULTURES[culture.culture].name} character`)
  }

  // Up to three picks; a fixed specialisation must match the book's (R7, R8).
  if (career.professional.length > CAREER_ALLOCATION.professionalPicks) {
    problems.push(`Choose at most ${CAREER_ALLOCATION.professionalPicks} professional skills`)
  }
  for (const pick of career.professional) {
    const refs = def.professionalSkills.filter((ref) => ref.skill === pick.skill)
    if (refs.length === 0) {
      problems.push(`${pick.skill} is not a ${def.name} professional skill`)
    } else if (!refs.some((ref) => ref.specialisation === undefined || ref.specialisation === pick.specialisation)) {
      problems.push(`${pick.skill} must be ${refs.map((ref) => skillKey(ref)).join(' or ')}`)
    } else {
      problems.push(...pickProblems(pick))
    }
  }
  const keys = career.professional.map(skillKey)
  if (new Set(keys).size !== keys.length) problems.push('Each professional skill can be chosen only once')

  problems.push(...slotProblems(culture, career))
  problems.push(...allocationProblems(career.points, careerEligibleSkills(culture, career), { ...CAREER_ALLOCATION, min: 0 }, 'career'))
  return problems
}

function slotProblems(culture: CultureChoices, career: CareerChoices): string[] {
  const slots = CAREERS[career.career].combatStyles
  if (career.styles.length !== slots.length) return [`Define the career's ${slots.length} combat style slots`]

  const problems: string[] = []
  slots.forEach((slot, i) => {
    const choice = career.styles[i]
    if (choice.use === 'cultural') {
      if (slot.kind === 'new') problems.push(`${slot.label} must be a new combat style`)
      else if (!culture.combatStyle) problems.push(`${slot.label}: no cultural combat style was taken, so define one here`)
    } else {
      // A Cultural Style slot defines the style only when the culture step took none.
      if (slot.kind === 'cultural' && culture.combatStyle) problems.push(`${slot.label} is the cultural combat style`)
      problems.push(...styleProblems(choice.style))
    }
  })

  const names = [culture.combatStyle, ...career.styles.map((s) => (s.use === 'new' ? s.style : null))]
    .filter((s) => s !== null)
    .map((s) => s.name.trim())
  if (new Set(names).size !== names.length) problems.push('Each combat style needs a different name')
  return problems
}
