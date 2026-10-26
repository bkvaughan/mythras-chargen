import { COMBAT_STYLE_BASE, COMBAT_STYLE_TRAITS } from '../data/combatStyles.ts'
import { ALL_SKILLS, CULTURE_SKILL_BONUS, STANDARD_SKILLS } from '../data/skills.ts'
import type { BaseFormula, SkillDef } from '../data/types.ts'
import type { Allocation, Characteristics, CombatStyle, SkillChoices, SkillPick } from './types.ts'

export function skillKey(pick: SkillPick): string {
  return pick.specialisation ? `${pick.skill} (${pick.specialisation})` : pick.skill
}

export function styleKey(style: CombatStyle): string {
  return `Combat Style (${style.name})`
}

export function findSkill(name: string): SkillDef | undefined {
  return ALL_SKILLS.find((s) => s.name === name)
}

export function baseValue(formula: BaseFormula, c: Characteristics): number {
  return c[formula[0]] + c[formula[1]]
}

/** Professional skills gained at culture, career and as the hobby, in that order, without repeats (R8). */
export function heldProfessionalSkills(choices: SkillChoices): SkillPick[] {
  const picks = [
    ...(choices.culture?.professional ?? []),
    ...(choices.career?.professional ?? []),
    ...(choices.bonus?.hobby?.kind === 'skill' ? [choices.bonus.hobby.pick] : []),
  ]
  return picks.filter((p, i) => picks.findIndex((q) => skillKey(q) === skillKey(p)) === i)
}

/** Combat styles from the culture, the career slots and the hobby, in that order (R9). */
export function heldCombatStyles(choices: SkillChoices): CombatStyle[] {
  const styles = [
    ...(choices.culture?.combatStyle ? [choices.culture.combatStyle] : []),
    ...(choices.career?.styles.flatMap((s) => (s.use === 'new' ? [s.style] : [])) ?? []),
    ...(choices.bonus?.hobby?.kind === 'style' ? [choices.bonus.hobby.style] : []),
  ]
  return styles.filter((s, i) => styles.findIndex((t) => styleKey(t) === styleKey(s)) === i)
}

export interface SkillRow {
  key: string
  kind: 'standard' | 'professional' | 'combatStyle'
  base: number
  /** Culture points, plus the +40 for Customs and Native Tongue once a culture is chosen. */
  culture: number
  career: number
  bonus: number
  total: number
}

/** Every skill the character has, with base, points per stage and total. */
export function skillTable(c: Characteristics, choices: SkillChoices): SkillRow[] {
  const row = (key: string, kind: SkillRow['kind'], base: number): SkillRow => {
    const cultureBonus = choices.culture && CULTURE_SKILL_BONUS.skills.includes(key) ? CULTURE_SKILL_BONUS.bonus : 0
    const culture = cultureBonus + (choices.culture?.points[key] ?? 0)
    const career = choices.career?.points[key] ?? 0
    const bonus = choices.bonus?.points[key] ?? 0
    return { key, kind, base, culture, career, bonus, total: base + culture + career + bonus }
  }
  return [
    ...STANDARD_SKILLS.map((s) => row(s.name, 'standard', baseValue(s.base, c))),
    ...heldProfessionalSkills(choices).map((p) => row(skillKey(p), 'professional', baseValue(findSkill(p.skill)!.base, c))),
    ...heldCombatStyles(choices).map((s) => row(styleKey(s), 'combatStyle', baseValue(COMBAT_STYLE_BASE, c))),
  ]
}

export function skillTotal(c: Characteristics, choices: SkillChoices, key: string): number {
  const found = skillTable(c, choices).find((r) => r.key === key)
  if (!found) throw new Error(`Character has no skill ${key}`)
  return found.total
}

/** Checks one stage's points: only eligible skills, each within min-max, the whole pool spent (R5). */
export function allocationProblems(
  points: Allocation,
  eligible: string[],
  rules: { pool: number; min: number; max: number },
  stage: string,
): string[] {
  const problems: string[] = []
  for (const [key, value] of Object.entries(points)) {
    if (value !== 0 && !eligible.includes(key)) problems.push(`${key} cannot receive ${stage} points`)
  }
  for (const key of eligible) {
    const value = points[key] ?? 0
    if (value < rules.min || value > rules.max) {
      problems.push(
        rules.min > 0
          ? `${key} needs between ${rules.min} and ${rules.max} ${stage} points`
          : `${key} can receive at most ${rules.max} ${stage} points`,
      )
    }
  }
  const spent = Object.values(points).reduce((sum, v) => sum + v, 0)
  if (spent < rules.pool) problems.push(`${rules.pool - spent} ${stage} points left to spend`)
  if (spent > rules.pool) problems.push(`${spent - rules.pool} ${stage} points overspent`)
  return problems
}

/** A pick names a known skill of the right type, with a specialisation exactly when the skill takes one (R7). */
export function pickProblems(pick: SkillPick): string[] {
  const def = findSkill(pick.skill)
  if (!def) return [`${pick.skill} is not a skill`]
  const spec = pick.specialisation?.trim()
  if (def.specialised && !spec) return [`${pick.skill} needs a specialisation`]
  return []
}

/** A combat style needs a name, and its trait must come from the p. 90 list (R10). */
export function styleProblems(style: CombatStyle): string[] {
  const problems: string[] = []
  if (!style.name.trim()) problems.push('A combat style needs a name')
  if (style.trait !== null && !COMBAT_STYLE_TRAITS.some((t) => t.name === style.trait)) problems.push(`${style.trait} is not a combat style trait`)
  return problems
}
