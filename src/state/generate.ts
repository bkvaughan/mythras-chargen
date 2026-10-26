import { AGE_CATEGORIES } from '../data/age.ts'
import type { Frame } from '../data/attributes.ts'
import { CAREER_ALLOCATION, CAREERS } from '../data/careers.ts'
import { CHARACTERISTICS, POINTS_BUILD } from '../data/characteristics.ts'
import { COMBAT_STYLE_TRAITS, SAMPLE_COMBAT_STYLES } from '../data/combatStyles.ts'
import { CULTURE_ALLOCATION, CULTURES } from '../data/cultures.ts'
import { EXTENDED_FAMILY, SIBLINGS } from '../data/family.ts'
import { PASSION_SUBJECTS, SPECIALISATIONS, SPECIES } from '../data/quickGenerate.ts'
import { PROFESSIONAL_SKILLS } from '../data/skills.ts'
import type { CultureId, Dice, SkillRef } from '../data/types.ts'
import { rollAgeing } from '../engine/ageing.ts'
import { rollHeightWeight } from '../engine/attributes.ts'
import { maritalStatus, rollBackgroundEvents, rollChildren, rollPeople } from '../engine/background.ts'
import { ageCategory, bonusEligibleSkills } from '../engine/bonus.ts'
import { availableCareers, careerEligibleSkills } from '../engine/career.ts'
import { rollCharacteristics } from '../engine/characteristics.ts'
import { cultureEligibleSkills } from '../engine/culture.ts'
import { lookupRow, roll, rollD100, rollDie, type Rng } from '../engine/dice.ts'
import { findSkill, heldCombatStyles, heldProfessionalSkills, skillKey } from '../engine/skills.ts'
import type { Characteristics, CombatStyle, SkillPick } from '../engine/types.ts'
import { newCharacter, type Character } from './character.ts'
import { deriveCharacter, STEPS } from './derive.ts'
import { reducer, skillChoices, type Action } from './reducer.ts'

// Quick-generate: a random choice at every step, made through the same reducer actions
// the wizard uses, so the result is an ordinary character the player can edit.
// Names are left blank (R19); specialisations and Passion subjects come from R24 and R25.

const STEP = 5 // Points go out in fives, as in the book's examples.
const FRAMES: Frame[] = ['lithe', 'medium', 'heavy']

const pick = <T>(list: readonly T[], rng: Rng): T => list[rollDie(list.length, rng) - 1]

function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rollDie(i + 1, rng) - 1
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Spreads `pool` points over `keys` in fives, each between min and max. */
export function allocate(keys: string[], pool: number, min: number, max: number, rng: Rng): Record<string, number> {
  const points = Object.fromEntries(keys.map((k) => [k, min]))
  let remaining = pool - min * keys.length
  while (remaining > 0) {
    const open = keys.filter((k) => points[k] + STEP <= max)
    if (open.length === 0) throw new Error(`Cannot spend ${pool} points on ${keys.length} skills`)
    points[pick(open, rng)] += STEP
    remaining -= STEP
  }
  return Object.fromEntries(Object.entries(points).filter(([, v]) => v > 0))
}

/** A random legal points build (R3): every characteristic from its minimum, one point at a time. */
function pointsBuild(rng: Rng): Characteristics {
  const values: Characteristics = { ...POINTS_BUILD.min }
  let remaining = POINTS_BUILD.pool - CHARACTERISTICS.reduce((sum, c) => sum + values[c], 0)
  while (remaining > 0) {
    values[pick(CHARACTERISTICS.filter((c) => values[c] < POINTS_BUILD.max), rng)] += 1
    remaining -= 1
  }
  return values
}

function specialisation(ref: SkillRef, rng: Rng): string | undefined {
  if (ref.specialisation) return ref.specialisation
  if (!findSkill(ref.skill)?.specialised) return undefined
  const options = ref.examples ?? (ref.hint === 'Specific Species' ? SPECIES : SPECIALISATIONS[ref.skill])
  return pick(options, rng)
}

/** Up to `count` different picks from a skill list, skipping any key in `exclude`. */
function pickSkills(refs: SkillRef[], count: number, rng: Rng, exclude: string[] = []): SkillPick[] {
  const picks: SkillPick[] = []
  for (const ref of shuffle(refs, rng)) {
    if (picks.length === count) break
    const spec = specialisation(ref, rng)
    const p: SkillPick = spec ? { skill: ref.skill, specialisation: spec } : { skill: ref.skill }
    if (![...exclude, ...picks.map(skillKey)].includes(skillKey(p))) picks.push(p)
  }
  return picks
}

/** A sample style (p. 13) not yet used, with its weapons and one of its suggested traits. */
function sampleStyle(used: string[], rng: Rng): CombatStyle {
  const s = pick(
    SAMPLE_COMBAT_STYLES.filter((x) => !used.includes(x.name)),
    rng,
  )
  return { name: s.name, weapons: s.weapons.join(', '), trait: pick(s.suggestedTraits, rng) }
}

export function generateCharacter(rng: Rng): Character {
  let c = newCharacter()
  const act = (action: Action) => (c = reducer(c, action))

  // Concept and characteristics
  const category = pick(AGE_CATEGORIES, rng)
  const method = pick(['rollInOrder', 'rollAndAssign', 'pointsBuild'] as const, rng)
  act({ type: 'setConcept', changes: { ageCategory: category.category, age: roll(category.ageDice, rng), method } })
  const values = method === 'pointsBuild' ? pointsBuild(rng) : rollCharacteristics(rng)
  act({ type: 'setCharacteristics', rolled: method === 'pointsBuild' ? null : values, values })

  const frame = pick(FRAMES, rng)
  act({ type: 'setAttributes', changes: { frame, ...rollHeightWeight(values.SIZ, frame, rng) } })

  // Culture
  const cultureId = pick(Object.keys(CULTURES) as CultureId[], rng)
  const culture = CULTURES[cultureId]
  act({ type: 'chooseCulture', culture: cultureId })
  const group = culture.standardSkillChoice
  const passions = PASSION_SUBJECTS[cultureId].map((options, i) => ({ verb: culture.passions[i].verb, ...pick(options, rng) }))
  const style: CombatStyle | null =
    rollDie(4, rng) > 1 ? { name: pick(culture.combatStyleNames, rng), weapons: '', trait: rollDie(2, rng) === 1 ? pick(COMBAT_STYLE_TRAITS, rng).name : null } : null
  act({
    type: 'updateCulture',
    changes: {
      standardChoice: group ? shuffle(group.options, rng).slice(0, group.pick) : [],
      professional: pickSkills(culture.professionalSkills, CULTURE_ALLOCATION.professionalPicks, rng),
      combatStyle: style,
      passions,
    },
  })
  const { min, max, pool } = CULTURE_ALLOCATION
  for (const [key, points] of Object.entries(allocate(cultureEligibleSkills(c.culture!), pool, min, max, rng))) {
    act({ type: 'setCulturePoints', key, points })
  }

  // Background: every table rolled, including the optional ones
  const people = (reputationRoll: number, connectionsRoll: number) =>
    rollPeople(reputationRoll, connectionsRoll, rng).map((kind) => ({ kind, name: '' }))
  const rollOrNone = (dice: Dice | null) => (dice === null ? null : roll(dice, rng))
  const siblingsRoll = rollD100(rng)
  const siblingsDice = lookupRow(SIBLINGS, siblingsRoll)
  const extendedFamilyRoll = rollD100(rng)
  const extended = lookupRow(EXTENDED_FAMILY, extendedFamilyRoll)
  const reputationRoll = rollD100(rng)
  const connectionsRoll = rollD100(rng)
  const marriageRoll = rollD100(rng)
  act({
    type: 'setBackground',
    changes: {
      socialClassRoll: rollD100(rng),
      moneyRoll: roll(culture.startingMoney.dice, rng),
      events: rollBackgroundEvents(category.category, rng),
      parentsRoll: rollD100(rng),
      siblingsRoll,
      siblings: rollOrNone(siblingsDice),
      extendedFamilyRoll,
      grandparents: rollOrNone(extended.grandparents),
      auntsAndUncles: rollOrNone(extended.auntsAndUncles),
      cousins: rollOrNone(extended.cousins),
      reputationRoll,
      connectionsRoll,
      people: people(reputationRoll, connectionsRoll),
      marriageRoll,
      children: maritalStatus(marriageRoll, values) === 'married' ? rollChildren(category.category, rng) : [],
    },
  })

  // Career: a cultural style where a slot allows one, otherwise a new sample style
  const careerId = pick(availableCareers(cultureId), rng)
  const career = CAREERS[careerId]
  act({ type: 'chooseCareer', career: careerId })
  const usedNames = style ? [style.name] : []
  const styles = career.combatStyles.map((slot) => {
    const useCultural = style !== null && (slot.kind === 'cultural' || (slot.kind === 'specificOrCultural' && rollDie(2, rng) === 1))
    if (useCultural) return { use: 'cultural' as const }
    const s = sampleStyle(usedNames, rng)
    usedNames.push(s.name)
    return { use: 'new' as const, style: s }
  })
  act({ type: 'updateCareer', changes: { professional: pickSkills(career.professionalSkills, CAREER_ALLOCATION.professionalPicks, rng), styles } })
  for (const [key, points] of Object.entries(allocate(careerEligibleSkills(c.culture!, c.career!), CAREER_ALLOCATION.pool, 0, CAREER_ALLOCATION.max, rng))) {
    act({ type: 'setCareerPoints', key, points })
  }

  // Bonus Skills: an optional hobby, then the pool spread over a few favoured skills
  const held = heldProfessionalSkills(skillChoices(c)).map(skillKey)
  const hobbyKind = rollDie(3, rng)
  if (hobbyKind === 2) {
    const [hobby] = pickSkills(
      PROFESSIONAL_SKILLS.map((s) => ({ skill: s.name })),
      1,
      rng,
      held,
    )
    act({ type: 'setHobby', hobby: { kind: 'skill', pick: hobby } })
  } else if (hobbyKind === 3) {
    act({ type: 'setHobby', hobby: { kind: 'style', style: sampleStyle(heldCombatStyles(skillChoices(c)).map((s) => s.name), rng) } })
  }
  const age = ageCategory(category.category)
  const favoured = shuffle(bonusEligibleSkills(skillChoices(c)), rng).slice(0, Math.ceil(age.bonusSkillPoints / age.maxSkillIncrease) + 3)
  for (const [key, points] of Object.entries(allocate(favoured, age.bonusSkillPoints, 0, age.maxSkillIncrease, rng))) {
    act({ type: 'setBonusPoints', key, points })
  }

  // Ageing, re-rolled if it would reduce a characteristic to 0 (R17)
  const derivedAge = c.concept.age!
  if (deriveCharacter(c).steps.ageing.applies) {
    do act({ type: 'setAgeing', rolls: rollAgeing(derivedAge, rng) })
    while (!deriveCharacter(c).steps.ageing.complete)
  }

  const incomplete = STEPS.filter((s) => !deriveCharacter(c).steps[s].complete)
  if (incomplete.length > 0) throw new Error(`Quick-generate left steps incomplete: ${incomplete.join(', ')}`)
  return c
}
