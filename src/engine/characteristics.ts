import { CHARACTERISTIC_DICE, CHARACTERISTICS, POINTS_BUILD } from '../data/characteristics.ts'
import type { Characteristic } from '../data/types.ts'
import { diceRange, roll, type Rng } from './dice.ts'
import type { Characteristics } from './types.ts'

/** Rolls every characteristic with its own dice, in order (p. 9). */
export function rollCharacteristics(rng: Rng): Characteristics {
  const result = {} as Characteristics
  for (const c of CHARACTERISTICS) result[c] = roll(CHARACTERISTIC_DICE[c], rng)
  return result
}

/** Rolled or hand-entered results must be possible on each characteristic's dice. */
export function rolledProblems(rolled: Characteristics): string[] {
  return CHARACTERISTICS.flatMap((c) => {
    const { min, max } = diceRange(CHARACTERISTIC_DICE[c])
    return rolled[c] < min || rolled[c] > max ? [`${c} must be ${min}-${max} on ${CHARACTERISTIC_DICE[c]}`] : []
  })
}

const sorted = (values: number[]) => [...values].sort((a, b) => a - b)

/**
 * Roll and assign (R2): the assigned values must be the rolled values, swapped only
 * between characteristics that share the same dice.
 */
export function assignmentProblems(rolled: Characteristics, assigned: Characteristics): string[] {
  const groups = new Map<string, Characteristic[]>()
  for (const c of CHARACTERISTICS) groups.set(CHARACTERISTIC_DICE[c], [...(groups.get(CHARACTERISTIC_DICE[c]) ?? []), c])

  const problems: string[] = []
  for (const [dice, members] of groups) {
    const want = sorted(members.map((c) => rolled[c]))
    const got = sorted(members.map((c) => assigned[c]))
    if (want.join() !== got.join()) {
      problems.push(`${members.join(', ')} must use the values rolled on ${dice}: ${want.join(', ')}`)
    }
  }
  return problems
}

/** Points build (R3). */
export function pointsBuildProblems(values: Characteristics): string[] {
  const problems: string[] = []
  for (const c of CHARACTERISTICS) {
    const min = POINTS_BUILD.min[c]
    if (values[c] < min || values[c] > POINTS_BUILD.max) problems.push(`${c} must be between ${min} and ${POINTS_BUILD.max}`)
  }
  const spent = CHARACTERISTICS.reduce((sum, c) => sum + values[c], 0)
  if (spent < POINTS_BUILD.pool) problems.push(`${POINTS_BUILD.pool - spent} characteristic points left to spend`)
  if (spent > POINTS_BUILD.pool) problems.push(`${spent - POINTS_BUILD.pool} characteristic points overspent`)
  return problems
}

/** Applies characteristic changes, such as Ageing losses, to a copy. */
export function withModifiers(base: Characteristics, modifiers: Partial<Characteristics>): Characteristics {
  const result = { ...base }
  for (const c of CHARACTERISTICS) result[c] += modifiers[c] ?? 0
  return result
}
