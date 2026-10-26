import type { PassionObject } from './passions.ts'
import type { CultureId } from './types.ts'

// Defaults for quick-generate only. These are not rules: the book gives no names for
// most specialisations or Passion subjects, so a generated character gets plain ones
// the player can rename (R24, R25).

/**
 * Specialisations by skill. Lore, Craft and Musicianship use the book's own examples
 * (Lore p. 48; Craft p. 46: rugs, pots, smithing; Musicianship p. 49: reed pipes, harp, lute);
 * the rest are setting-neutral defaults. Career hints with examples take precedence.
 */
export const SPECIALISATIONS: Record<string, string[]> = {
  Lore: ['Astrology', 'Astronomy', 'Geography', 'History', 'Monsters', 'Mythology', 'Politics', 'Strategy and Tactics'],
  Craft: ['Weaving', 'Pottery', 'Smithing'],
  Musicianship: ['Reed Pipes', 'Harp', 'Lute'],
  Art: ['Painting', 'Sculpture', 'Poetry'],
  Culture: ['Neighbouring Culture'],
  Language: ['Neighbouring Tongue', 'Trade Tongue'],
  Healing: ['Human'],
  Teach: ['Human'],
  Devotion: ['Local God'],
  Binding: ['Ancestor Spirits'],
  Invocation: ['Local School'],
}

/** For career hints that ask for a "Specific Species" (Beast Handler, Herder). */
export const SPECIES = ['Horses', 'Dogs', 'Cattle']

export interface PassionDefault {
  subject: string
  object: PassionObject
}

const LOVE: PassionDefault[] = [
  { subject: 'Friend', object: 'platonic' },
  { subject: 'Sibling', object: 'romantic' },
  { subject: 'Lover', object: 'romantic' },
]

/** One list per cultural Passion, in the culture's order (Loyalty, Love, Hate; pp. 15-18). */
export const PASSION_SUBJECTS: Record<CultureId, [PassionDefault[], PassionDefault[], PassionDefault[]]> = {
  barbarian: [
    [{ subject: 'Clan Chieftain', object: 'platonic' }],
    LOVE,
    [
      { subject: 'Rival Clan', object: 'organisation' },
      { subject: 'Rival', object: 'averse' },
    ],
  ],
  civilised: [
    [{ subject: 'Home City', object: 'place' }],
    LOVE,
    [
      { subject: 'Rival Gang', object: 'organisation' },
      { subject: 'Rival', object: 'averse' },
      { subject: 'Rival City', object: 'place' },
    ],
  ],
  nomadic: [
    [{ subject: 'Khan', object: 'platonic' }],
    LOVE,
    [
      { subject: 'Rival Tribe', object: 'organisation' },
      { subject: 'Rival', object: 'averse' },
    ],
  ],
  primitive: [
    [{ subject: 'Headman', object: 'platonic' }],
    LOVE,
    // The book's examples of a feared race or creature (Passions table, p. 24).
    [
      { subject: 'Ghosts', object: 'race' },
      { subject: 'Supernatural Beasts', object: 'race' },
    ],
  ],
}
