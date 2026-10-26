import { expect, test } from 'vitest'
import type { PassionObject } from '../data/passions.ts'
import { passionValue } from './passions.ts'
import { ANATHAYM } from './testFixtures.ts'

// Anathaym: POW 7, INT 14, CHA 9. Subject (where needed): POW 12, CHA 15.
test.each<[PassionObject, number]>([
  ['romantic', 30 + 12 + 15],
  ['platonic', 30 + 7 + 15],
  ['averse', 30 + 7 + 15],
  ['organisation', 30 + 7 + 14],
  ['place', 30 + 7 + 14],
  ['concept', 30 + 7 + 14],
  ['race', 30 + 7 + 7],
  ['object', 30 + 7 + 7],
])('%s starts at %i (R13)', (object, value) => {
  expect(passionValue({ verb: 'Love', subject: 'X', object, subjectPOW: 12, subjectCHA: 15 }, ANATHAYM)).toBe(value)
})

test("subject characteristics default to the character's own", () => {
  expect(passionValue({ verb: 'Love', subject: 'Kara', object: 'romantic' }, ANATHAYM)).toBe(30 + 7 + 9)
})

test('no object type, no value', () => {
  expect(passionValue({ verb: 'Hate', subject: 'Xenos', object: null }, ANATHAYM)).toBeNull()
})
