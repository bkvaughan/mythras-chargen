import { AGE_CATEGORIES, type AgeCategory, type AgeCategoryDef } from '../data/age.ts'
import { STANDARD_SKILLS } from '../data/skills.ts'
import {
  allocationProblems,
  findSkill,
  heldCombatStyles,
  heldProfessionalSkills,
  pickProblems,
  skillKey,
  styleKey,
  styleProblems,
} from './skills.ts'
import type { SkillChoices } from './types.ts'

export function ageCategory(category: AgeCategory): AgeCategoryDef {
  return AGE_CATEGORIES.find((a) => a.category === category)!
}

/** Every skill the character has, including the hobby (R11). */
export function bonusEligibleSkills(choices: SkillChoices): string[] {
  return [
    ...STANDARD_SKILLS.map((s) => s.name),
    ...heldProfessionalSkills(choices).map(skillKey),
    ...heldCombatStyles(choices).map(styleKey),
  ]
}

export function bonusProblems(choices: SkillChoices, category: AgeCategory): string[] {
  if (!choices.bonus) return ['Spend the bonus skill points']
  const problems: string[] = []
  const hobby = choices.bonus.hobby

  // The hobby is one new professional skill or combat style (R11).
  if (hobby?.kind === 'skill') {
    if (findSkill(hobby.pick.skill)?.type !== 'professional') problems.push(`${hobby.pick.skill} is not a professional skill`)
    else problems.push(...pickProblems(hobby.pick))
    const before = heldProfessionalSkills({ ...choices, bonus: null }).map(skillKey)
    if (before.includes(skillKey(hobby.pick))) problems.push(`The hobby must be a new skill; ${skillKey(hobby.pick)} is already known`)
  }
  if (hobby?.kind === 'style') {
    problems.push(...styleProblems(hobby.style))
    const before = heldCombatStyles({ ...choices, bonus: null }).map((s) => s.name.trim())
    if (before.includes(hobby.style.name.trim())) problems.push('The hobby combat style needs a new name')
  }

  const age = ageCategory(category)
  problems.push(
    ...allocationProblems(
      choices.bonus.points,
      bonusEligibleSkills(choices),
      { pool: age.bonusSkillPoints, min: 0, max: age.maxSkillIncrease },
      'bonus',
    ),
  )
  return problems
}
