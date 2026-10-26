import { CONNECTIONS, EXTENDED_FAMILY, PARENTS, REPUTATION, SIBLINGS } from '../data/family.ts'
import { backgroundEvent, maritalStatus } from '../engine/background.ts'
import { lookupRow } from '../engine/dice.ts'
import { findSkill, type SkillRow } from '../engine/skills.ts'
import type { Character } from './character.ts'
import type { DerivedCharacter } from './derive.ts'

// The official character sheet lists these standard skills apart, as Resistances.
const RESISTANCES = ['Brawn', 'Endurance', 'Evade', 'Willpower']

export interface SheetSkills {
  standard: SkillRow[]
  resistances: SkillRow[]
  professional: SkillRow[]
  /** Native Tongue first, then each Language. */
  languages: SkillRow[]
  magic: SkillRow[]
  combatStyles: SkillRow[]
}

/** Groups the skill table the way the official sheet does. */
export function sheetSkills(skills: SkillRow[]): SheetSkills {
  const isLanguage = (r: SkillRow) => r.skill === 'Native Tongue' || r.skill === 'Language'
  const isMagic = (r: SkillRow) => findSkill(r.skill)?.magic === true
  return {
    standard: skills.filter((r) => r.kind === 'standard' && !RESISTANCES.includes(r.skill) && !isLanguage(r)),
    resistances: skills.filter((r) => RESISTANCES.includes(r.skill)),
    professional: skills.filter((r) => r.kind === 'professional' && !isLanguage(r) && !isMagic(r)),
    languages: skills.filter(isLanguage),
    magic: skills.filter((r) => r.kind === 'professional' && isMagic(r)),
    combatStyles: skills.filter((r) => r.kind === 'combatStyle'),
  }
}

const MARITAL = { married: 'Married', betrothed: 'Betrothed', unmarried: 'Unmarried' }

/** The background, family and connections results as short lines for the sheet's notes. */
export function backgroundNotes(c: Character, derived: DerivedCharacter): string[] {
  const b = c.background
  const notes: string[] = []
  if (derived.socialClass) notes.push(`Social class: ${derived.socialClass.name}. ${derived.socialClass.resources}.`)
  for (const d100 of b.events) notes.push(`Background event: ${backgroundEvent(d100).result}.`)
  if (b.parentsRoll !== null) notes.push(`Parents: ${lookupRow(PARENTS, b.parentsRoll)}.`)
  if (b.siblingsRoll !== null) {
    const dice = lookupRow(SIBLINGS, b.siblingsRoll)
    notes.push(dice === null ? 'Siblings: none.' : `Siblings: ${b.siblings ?? dice}.`)
  }
  if (b.extendedFamilyRoll !== null) {
    const row = lookupRow(EXTENDED_FAMILY, b.extendedFamilyRoll)
    notes.push(
      row.grandparents === null
        ? 'Extended family: none.'
        : `Extended family: grandparents ${b.grandparents ?? row.grandparents}, aunts and uncles ${b.auntsAndUncles ?? row.auntsAndUncles}, cousins ${b.cousins ?? row.cousins}.`,
    )
  }
  if (b.reputationRoll !== null) notes.push(`Reputation: ${lookupRow(REPUTATION, b.reputationRoll).summary}.`)
  if (b.connectionsRoll !== null) notes.push(`Connections: ${lookupRow(CONNECTIONS, b.connectionsRoll).summary}.`)
  if (b.people.length > 0) notes.push(b.people.map((p) => `${p.kind}: ${p.name.trim() || 'unnamed'}`).join('; ') + '.')
  const values = c.characteristics.values
  if (b.marriageRoll !== null && values) {
    const status = maritalStatus(b.marriageRoll, values)
    const children = b.children.length > 0 ? `, children aged ${b.children.join(', ')}` : ''
    notes.push(`${MARITAL[status]}${children}.`)
  }
  return notes
}
