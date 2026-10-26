import { describe, expect, test } from 'vitest'
import {
  backgroundEvent,
  backgroundProblems,
  childAgeDice,
  connectionKind,
  maritalStatus,
  rollBackgroundEvents,
  socialClass,
  startingMoney,
} from './background.ts'
import { seededRng } from './dice.ts'
import { ANATHAYM } from './testFixtures.ts'

describe('social class and money (R14)', () => {
  test.each([
    [20, 'Slave'],
    [21, 'Freeman'],
    [70, 'Freeman'],
    [71, 'Gentry'],
    [99, 'Aristocracy'],
    [100, 'Ruling'],
  ])('Civilised %i is %s', (d100, name) => expect(socialClass('civilised', d100).name).toBe(name))

  test('money is 4d6 x culture multiplier x Money Modifier, rounded up', () => {
    expect(startingMoney('civilised', 9, 97)).toBe(3375)
    expect(startingMoney('primitive', 5, 1)).toBe(13) // 5 x 10 x 0.25 = 12.5
    expect(startingMoney('barbarian', 24, 50)).toBe(1200)
  })
})

describe('background events (R12)', () => {
  test('rolls on the same row are the same event', () => {
    expect(backgroundEvent(3)).toBe(backgroundEvent(4))
    expect(backgroundEvent(4)).not.toBe(backgroundEvent(5))
  })

  test('rolls the age category count without repeats', () => {
    const rng = seededRng(11)
    expect(rollBackgroundEvents('young', rng)).toEqual([])
    for (let i = 0; i < 100; i++) {
      const events = rollBackgroundEvents('old', rng).map(backgroundEvent)
      expect(new Set(events).size).toBe(4)
    }
  })
})

describe('backgroundProblems (R23)', () => {
  const valid = { culture: 'civilised' as const, ageCategory: 'adult' as const, socialClassRoll: 97, moneyRoll: 9, events: [37] }

  test('complete', () => {
    expect(backgroundProblems(valid)).toEqual([])
    expect(backgroundProblems({ ...valid, ageCategory: 'young', events: [] })).toEqual([])
  })

  test('missing items', () => {
    expect(backgroundProblems({ ...valid, socialClassRoll: null, moneyRoll: null, events: [] })).toEqual([
      'Roll or choose a social class',
      'Roll or enter starting money (4-24 on 4d6)',
      'Choose 1 background event (0 chosen)',
    ])
  })

  test('money roll outside 4d6', () => {
    expect(backgroundProblems({ ...valid, moneyRoll: 3 })).toHaveLength(1)
    expect(backgroundProblems({ ...valid, moneyRoll: 25 })).toHaveLength(1)
    expect(backgroundProblems({ ...valid, moneyRoll: 24 })).toEqual([])
  })

  test('repeated events', () => {
    expect(backgroundProblems({ ...valid, ageCategory: 'middleAged', events: [3, 4] })).toEqual([
      'Each background event can be taken only once',
    ])
  })
})

describe('family', () => {
  test('connection kinds by 1d4', () => {
    expect([1, 2, 3, 4].map(connectionKind)).toEqual(['Ally', 'Contact', 'Enemy', 'Rival'])
  })

  test('marital status against base Influence', () => {
    // Anathaym's base Influence is 18; a tenth is 1.8, rounded up to 2.
    expect(maritalStatus(2, ANATHAYM)).toBe('married')
    expect(maritalStatus(3, ANATHAYM)).toBe('betrothed')
    expect(maritalStatus(18, ANATHAYM)).toBe('betrothed')
    expect(maritalStatus(19, ANATHAYM)).toBe('unmarried')
  })

  test('child age dice (R21)', () => {
    expect(childAgeDice('young')).toBe('1d4')
    expect(childAgeDice('adult')).toBe('1d4')
    expect(childAgeDice('middleAged')).toBe('2d6+15')
    expect(childAgeDice('old')).toBe('4d6+40')
  })
})
