import type { Characteristic } from './types.ts'

export type PassionObject =
  | 'romantic'
  | 'platonic'
  | 'averse'
  | 'organisation'
  | 'race'
  | 'place'
  | 'object'
  | 'concept'

export interface PassionObjectDef {
  name: string
  examples: string[]
  /** Starting value is 30 plus these characteristics, each the character's or the subject's (R13). */
  terms: { of: 'character' | 'subject'; characteristic: Characteristic }[]
}

export const PASSION_BASE = 30

const own = (characteristic: Characteristic) => ({ of: 'character' as const, characteristic })
const subject = (characteristic: Characteristic) => ({ of: 'subject' as const, characteristic })

// Passions table, p. 24.
export const PASSION_OBJECTS: Record<PassionObject, PassionObjectDef> = {
  romantic: {
    name: 'A person, in a romantic or familial context',
    examples: ['Lover', 'Sibling', 'Wife', 'Parent', 'Aloof or Unsuspecting Object of Desire'],
    terms: [subject('POW'), subject('CHA')],
  },
  platonic: {
    name: 'A person in a platonic context',
    examples: ['Leader', 'Teacher', 'Ruler', 'Master', 'Rescuer', 'Priest', 'Enemy'],
    terms: [own('POW'), subject('CHA')],
  },
  averse: {
    name: 'A person in an averse context',
    examples: ['Enemy leader', 'Rival worker', 'Husband of Desired Lover', 'Murderer of Friend', 'Thief'],
    terms: [own('POW'), subject('CHA')],
  },
  organisation: {
    name: 'An organisation or group of people',
    examples: ['Family', 'School', 'Temple', 'Religion', 'Local Community', 'Military Unit', 'Guild', 'Nobles'],
    terms: [own('POW'), own('INT')],
  },
  race: {
    name: 'A race or species',
    examples: ['Foreigners', 'Non Humans', 'Tigers', 'Supernatural Beasts', 'Ghosts', 'Primitives'],
    terms: [own('POW'), own('POW')],
  },
  place: {
    name: 'A place',
    examples: ['A Country', 'Home Town', 'Holy Place', 'Capital City', 'Graveyards', 'Mountains'],
    terms: [own('POW'), own('INT')],
  },
  object: {
    name: 'An object or substance',
    examples: ['The Iron Throne', 'Diabolic Relic', 'Magic', 'Darkness', 'Ancient Heirloom', 'Gemstones'],
    terms: [own('POW'), own('POW')],
  },
  concept: {
    name: 'A concept or ideal',
    examples: ['An Ethic', 'Moral Code', 'Freedom', 'Personal Honour', 'Betrayal', 'Dishonesty'],
    terms: [own('POW'), own('INT')],
  },
}
