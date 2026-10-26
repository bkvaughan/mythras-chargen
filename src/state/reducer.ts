import { CAREERS } from '../data/careers.ts'
import { CULTURES } from '../data/cultures.ts'
import type { CareerId, CultureId } from '../data/types.ts'
import { maritalStatus } from '../engine/background.ts'
import { ageCategory, bonusEligibleSkills } from '../engine/bonus.ts'
import { availableCareers, careerEligibleSkills } from '../engine/career.ts'
import { cultureEligibleSkills } from '../engine/culture.ts'
import { diceRange } from '../engine/dice.ts'
import { heldCombatStyles, heldProfessionalSkills, skillKey, styleKey } from '../engine/skills.ts'
import type { AgeingBandRolls } from '../engine/ageing.ts'
import type { Allocation, Characteristics, Hobby, SkillChoices } from '../engine/types.ts'
import { newCharacter, type Character } from './character.ts'

type CultureState = NonNullable<Character['culture']>
type CareerState = NonNullable<Character['career']>

export type Action =
  | { type: 'setConcept'; changes: Partial<Character['concept']> }
  | { type: 'setCharacteristics'; rolled: Characteristics | null; values: Characteristics | null }
  | { type: 'setAttributes'; changes: Partial<Character['attributes']> }
  | { type: 'chooseCulture'; culture: CultureId }
  | { type: 'updateCulture'; changes: Partial<Omit<CultureState, 'culture' | 'points'>> }
  | { type: 'setCulturePoints'; key: string; points: number }
  | { type: 'setBackground'; changes: Partial<Character['background']> }
  | { type: 'chooseCareer'; career: CareerId }
  | { type: 'updateCareer'; changes: Partial<Omit<CareerState, 'career' | 'points'>> }
  | { type: 'setCareerPoints'; key: string; points: number }
  | { type: 'setHobby'; hobby: Hobby | null }
  | { type: 'setBonusPoints'; key: string; points: number }
  | { type: 'setAgeing'; rolls: AgeingBandRolls[] }
  | { type: 'load'; character: Character }
  | { type: 'reset' }

export function skillChoices(c: Character): SkillChoices {
  return { culture: c.culture, career: c.career, bonus: c.bonus }
}

export function reducer(state: Character, action: Action): Character {
  return prune(state, apply(state, action))
}

function apply(state: Character, action: Action): Character {
  switch (action.type) {
    case 'setConcept': {
      const concept = { ...state.concept, ...action.changes }
      // A new generation method starts the characteristics afresh.
      const characteristics = concept.method === state.concept.method ? state.characteristics : { rolled: null, values: null }
      let background = state.background
      // A new age category drops an age outside its range and events beyond its count.
      if (concept.ageCategory !== state.concept.ageCategory) {
        const category = ageCategory(concept.ageCategory)
        const range = diceRange(category.ageDice)
        if (concept.age !== null && (concept.age < range.min || concept.age > range.max)) concept.age = null
        background = { ...background, events: background.events.slice(0, category.backgroundEvents) }
      }
      return { ...state, concept, characteristics, background }
    }
    case 'setCharacteristics':
      return { ...state, characteristics: { rolled: action.rolled, values: action.values } }
    case 'setAttributes':
      return { ...state, attributes: { ...state.attributes, ...action.changes } }
    case 'chooseCulture': {
      if (state.culture?.culture === action.culture) return state
      const passions = CULTURES[action.culture].passions.map((p) => ({ verb: p.verb, subject: '', object: null }))
      const culture: CultureState = {
        culture: action.culture,
        standardChoice: [],
        professional: [],
        combatStyle: null,
        points: {},
        passions,
        nativeTongue: '',
      }
      return { ...state, culture }
    }
    case 'updateCulture': {
      if (!state.culture) return state
      const next = { ...state, culture: { ...state.culture, ...action.changes } }
      return rekey(state, next)
    }
    case 'setCulturePoints':
      return state.culture ? { ...state, culture: { ...state.culture, points: setPoints(state.culture.points, action) } } : state
    case 'setBackground':
      return { ...state, background: { ...state.background, ...action.changes } }
    case 'chooseCareer': {
      if (state.career?.career === action.career) return state
      const hasCulturalStyle = Boolean(state.culture?.combatStyle)
      const styles = CAREERS[action.career].combatStyles.map((slot) =>
        slot.kind !== 'new' && hasCulturalStyle
          ? ({ use: 'cultural' } as const)
          : ({ use: 'new', style: { name: '', weapons: '', trait: null } } as const),
      )
      return { ...state, career: { career: action.career, professional: [], styles, points: {} } }
    }
    case 'updateCareer': {
      if (!state.career) return state
      const next = { ...state, career: { ...state.career, ...action.changes } }
      return rekey(state, next)
    }
    case 'setCareerPoints':
      return state.career ? { ...state, career: { ...state.career, points: setPoints(state.career.points, action) } } : state
    case 'setHobby': {
      const bonus = state.bonus ?? { hobby: null, points: {} }
      return rekey(state, { ...state, bonus: { ...bonus, hobby: action.hobby } })
    }
    case 'setBonusPoints': {
      const bonus = state.bonus ?? { hobby: null, points: {} }
      return { ...state, bonus: { ...bonus, points: setPoints(bonus.points, action) } }
    }
    case 'setAgeing':
      return { ...state, ageing: action.rolls }
    case 'load':
      return action.character
    case 'reset':
      return newCharacter()
  }
}

function setPoints(points: Allocation, { key, points: value }: { key: string; points: number }): Allocation {
  const next = { ...points }
  if (value === 0) delete next[key]
  else next[key] = value
  return next
}

/** Skill keys in a stable order, so an edited specialisation or style name lines up with its old key. */
function positionalKeys(c: Character): string[] {
  const choices = skillChoices(c)
  return [
    ...(c.culture?.professional.map(skillKey) ?? []),
    ...(c.culture?.combatStyle ? [styleKey(c.culture.combatStyle)] : []),
    ...(c.career?.professional.map(skillKey) ?? []),
    ...(c.career?.styles.map((s) => (s.use === 'new' ? styleKey(s.style) : '')) ?? []),
    ...(choices.bonus?.hobby?.kind === 'skill' ? [skillKey(choices.bonus.hobby.pick)] : []),
    ...(choices.bonus?.hobby?.kind === 'style' ? [styleKey(choices.bonus.hobby.style)] : []),
  ]
}

/**
 * When a skill is renamed in place (a specialisation or style name edited), its points
 * follow it instead of being dropped. Only applies when no pick was added or removed.
 */
function rekey(before: Character, after: Character): Character {
  const oldKeys = positionalKeys(before)
  const newKeys = positionalKeys(after)
  if (oldKeys.length !== newKeys.length) return after
  const stillHeld = new Set([
    ...heldProfessionalSkills(skillChoices(after)).map(skillKey),
    ...heldCombatStyles(skillChoices(after)).map(styleKey),
  ])
  const moves = oldKeys.flatMap((from, i) => (from && from !== newKeys[i] && !stillHeld.has(from) ? [[from, newKeys[i]]] : []))
  if (moves.length === 0) return after

  const move = (points: Allocation): Allocation => {
    const next = { ...points }
    for (const [from, to] of moves) {
      if (next[from] === undefined) continue
      next[to] = (next[to] ?? 0) + next[from]
      delete next[from]
    }
    return next
  }
  return {
    ...after,
    culture: after.culture && { ...after.culture, points: move(after.culture.points) },
    career: after.career && { ...after.career, points: move(after.career.points) },
    bonus: after.bonus && { ...after.bonus, points: move(after.bonus.points) },
  }
}

const keep = (points: Allocation, eligible: string[]): Allocation =>
  Object.fromEntries(Object.entries(points).filter(([key]) => eligible.includes(key)))

/** Clears later choices an earlier change has made meaningless; keeps everything else. */
function prune(before: Character, c: Character): Character {
  if (c === before) return c
  let next = { ...c }

  if (next.career && (!next.culture || !availableCareers(next.culture.culture).includes(next.career.career))) {
    next.career = null
  }
  if (next.culture) next.culture = { ...next.culture, points: keep(next.culture.points, cultureEligibleSkills(next.culture)) }
  if (next.career && next.culture) {
    next.career = { ...next.career, points: keep(next.career.points, careerEligibleSkills(next.culture, next.career)) }
  }
  if (next.bonus) next.bonus = { ...next.bonus, points: keep(next.bonus.points, bonusEligibleSkills(skillChoices(next))) }

  const background = { ...next.background }
  // Children belong only to a married character (R21).
  const values = next.characteristics.values
  if (background.marriageRoll === null || (values && maritalStatus(background.marriageRoll, values) !== 'married')) {
    background.children = []
  }
  next = { ...next, background }
  return next
}
