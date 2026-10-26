import type { Bracket, D100Row, Dice } from '../data/types.ts'

/** Returns a number in [0, 1), like Math.random. */
export type Rng = () => number

/** Deterministic generator for tests and reproducible quick-generate (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rollDie(sides: number, rng: Rng): number {
  return Math.floor(rng() * sides) + 1
}

interface DiceTerm {
  sign: 1 | -1
  count: number
  /** 0 for a constant term. */
  sides: number
}

/** Parses expressions such as '3d6', '2d6+6', '1d3-1', '1d8+1d6' and '1'. */
export function parseDice(expr: Dice): DiceTerm[] {
  const compact = expr.replace(/\s/g, '')
  const terms = compact.match(/[+-]?[^+-]+/g)
  if (!terms || terms.join('') !== compact) throw new Error(`Bad dice expression: ${expr}`)
  return terms.map((raw) => {
    const sign = raw.startsWith('-') ? -1 : 1
    const body = raw.replace(/^[+-]/, '')
    const dice = body.match(/^(\d+)d(\d+)$/)
    if (dice) return { sign, count: Number(dice[1]), sides: Number(dice[2]) }
    if (/^\d+$/.test(body)) return { sign, count: Number(body), sides: 0 }
    throw new Error(`Bad dice expression: ${expr}`)
  })
}

export function roll(expr: Dice, rng: Rng): number {
  let total = 0
  for (const term of parseDice(expr)) {
    if (term.sides === 0) {
      total += term.sign * term.count
      continue
    }
    for (let i = 0; i < term.count; i++) total += term.sign * rollDie(term.sides, rng)
  }
  return total
}

export function diceRange(expr: Dice): { min: number; max: number } {
  let min = 0
  let max = 0
  for (const term of parseDice(expr)) {
    // Every die rolls at least 1, so a dice term's minimum equals its count, like a constant.
    const low = term.count
    const high = term.sides === 0 ? term.count : term.count * term.sides
    if (term.sign === 1) {
      min += low
      max += high
    } else {
      min -= high
      max -= low
    }
  }
  return { min, max }
}

export function rollD100(rng: Rng): number {
  return rollDie(100, rng)
}

export function lookupRow<T>(rows: D100Row<T>[], d100: number): T {
  const row = rows.find((r) => d100 >= r.min && d100 <= r.max)
  if (!row) throw new Error(`No table row for ${d100}`)
  return row.result
}

/** The value of the first bracket whose `upTo` is at or above `value`. */
export function lookupBracket<T>(brackets: Bracket<T>[], value: number): T {
  const bracket = brackets.find((b) => value <= b.upTo)
  if (!bracket) throw new Error(`No bracket for ${value}`)
  return bracket.value
}

/** A random whole number in [min, max]. */
export function rollBetween(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1))
}
