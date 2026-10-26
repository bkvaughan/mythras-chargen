import type { D100Row, Dice } from './types.ts'

// Family and Connections tables, p. 26.

export const PARENTS: D100Row<string>[] = [
  { min: 1, max: 20, result: 'Both parents living' },
  { min: 21, max: 40, result: 'Single parent: father' },
  { min: 41, max: 60, result: 'One birth parent plus step-parent' },
  { min: 61, max: 80, result: 'Single parent: mother' },
  { min: 81, max: 100, result: 'Both parents dead' },
]

/** Number of siblings as dice; null means none. */
export const SIBLINGS: D100Row<Dice | null>[] = [
  { min: 1, max: 10, result: null },
  { min: 11, max: 30, result: '1d4' },
  { min: 31, max: 70, result: '1d6' },
  { min: 71, max: 90, result: '1d8' },
  { min: 91, max: 100, result: '1d10' },
]

export interface ExtendedFamily {
  grandparents: Dice | null
  auntsAndUncles: Dice | null
  cousins: Dice | null
}

export const EXTENDED_FAMILY: D100Row<ExtendedFamily>[] = [
  { min: 1, max: 10, result: { grandparents: null, auntsAndUncles: null, cousins: null } },
  { min: 11, max: 30, result: { grandparents: '1d2-1', auntsAndUncles: '1d2', cousins: '1d3' } },
  { min: 31, max: 70, result: { grandparents: '1d3-1', auntsAndUncles: '1d3', cousins: '1d4' } },
  { min: 71, max: 90, result: { grandparents: '1d3', auntsAndUncles: '1d4', cousins: '1d6' } },
  { min: 91, max: 100, result: { grandparents: '1d3+1', auntsAndUncles: '1d6', cousins: '1d8' } },
]

export type ConnectionKind = 'Ally' | 'Contact' | 'Enemy' | 'Rival'

export interface ReputationResult {
  /** Our own short summary of the book's entry. */
  summary: string
  /** People gained: a count, and the kinds the player labels each one as (R18). */
  connections: { count: Dice; kinds: [ConnectionKind, ConnectionKind] } | null
}

export const REPUTATION: D100Row<ReputationResult>[] = [
  { min: 1, max: 15, result: { summary: 'Poor reputation', connections: { count: '1d3', kinds: ['Enemy', 'Rival'] } } },
  {
    min: 16,
    max: 35,
    result: { summary: 'Sound reputation, with a few secrets', connections: { count: '1', kinds: ['Enemy', 'Rival'] } },
  },
  { min: 36, max: 65, result: { summary: 'Sound reputation', connections: null } },
  {
    min: 66,
    max: 85,
    result: { summary: 'Good reputation, though some could tarnish it', connections: { count: '1', kinds: ['Contact', 'Ally'] } },
  },
  {
    min: 86,
    max: 100,
    result: { summary: 'Spotless, excellent reputation', connections: { count: '1d3', kinds: ['Contact', 'Ally'] } },
  },
]

export interface ConnectionsResult {
  summary: string
  /** Number of rolls on CONNECTION_KIND. */
  rolls: number
}

export const CONNECTIONS: D100Row<ConnectionsResult>[] = [
  { min: 1, max: 20, result: { summary: 'No connections of note', rolls: 0 } },
  { min: 21, max: 80, result: { summary: 'Reasonable connections in the community', rolls: 1 } },
  { min: 81, max: 90, result: { summary: 'Well connected locally, known to those with local power', rolls: 2 } },
  { min: 91, max: 95, result: { summary: 'As above, with standing among those with regional power', rolls: 3 } },
  { min: 96, max: 100, result: { summary: 'As above, with standing among those with national power', rolls: 4 } },
]

/** 1d4 per Connections roll. */
export const CONNECTION_KIND: { roll: number; kind: ConnectionKind }[] = [
  { roll: 1, kind: 'Ally' },
  { roll: 2, kind: 'Contact' },
  { roll: 3, kind: 'Enemy' },
  { roll: 4, kind: 'Rival' },
]

// Marriage, p. 24 (optional). Roll 1d100 against base Influence: at or under it the character is
// betrothed; at or under a tenth of it, already married.
export const MARRIAGE = {
  marriedFraction: 0.1,
  /** Children of a married character (R21). */
  children: '1d4-1' as Dice,
  /** Age of each child for Young or Adult parents; older parents use the next-younger Age category (R21). */
  childAge: '1d4' as Dice,
}
