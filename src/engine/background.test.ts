import { describe, expect, test } from 'vitest'
import {
  backgroundEvent,
  backgroundProblems,
  childAgeDice,
  connectionKind,
  familyProblems,
  maritalStatus,
  rollBackgroundEvent,
  rollBackgroundEvents,
  rollChildren,
  rollPeople,
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

  test('a single roll never repeats a held event', () => {
    const rng = seededRng(3)
    const held = [1, 3, 5, 7, 9, 11, 13, 14, 16, 18, 20, 21, 23, 25, 26]
    for (let i = 0; i < 200; i++) {
      const d100 = rollBackgroundEvent(held, rng)
      expect(held.map(backgroundEvent)).not.toContain(backgroundEvent(d100))
    }
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

describe('people from reputation and connections (R18)', () => {
  const rng = seededRng(7)
  test('nothing without rolls or with neutral results', () => {
    expect(rollPeople(null, null, rng)).toEqual([])
    expect(rollPeople(36, 1, rng)).toEqual([])
    expect(rollPeople(65, 20, rng)).toEqual([])
  })

  test.each([
    [1, 1, 3, ['Enemy', 'Rival']],
    [15, 1, 3, ['Enemy', 'Rival']],
    [16, 1, 1, ['Enemy', 'Rival']],
    [35, 1, 1, ['Enemy', 'Rival']],
    [66, 1, 1, ['Contact', 'Ally']],
    [85, 1, 1, ['Contact', 'Ally']],
    [86, 1, 3, ['Contact', 'Ally']],
    [100, 1, 3, ['Contact', 'Ally']],
  ])('reputation %i gives %i-%i of %j', (d100, min, max, kinds) => {
    for (let i = 0; i < 50; i++) {
      const people = rollPeople(d100, null, rng)
      expect(people.length).toBeGreaterThanOrEqual(min)
      expect(people.length).toBeLessThanOrEqual(max)
      for (const p of people) expect(kinds).toContain(p)
    }
  })

  test.each([
    [21, 1],
    [80, 1],
    [81, 2],
    [90, 2],
    [91, 3],
    [95, 3],
    [96, 4],
    [100, 4],
  ])('connections %i gives %i people', (d100, count) => {
    expect(rollPeople(null, d100, rng)).toHaveLength(count)
  })
})

describe('children (R21)', () => {
  test('0-3 children with ages on the parent category dice', () => {
    const rng = seededRng(5)
    const counts = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const adult = rollChildren('adult', rng)
      counts.add(adult.length)
      for (const age of adult) expect(age).toBeGreaterThanOrEqual(1)
      for (const age of adult) expect(age).toBeLessThanOrEqual(4)
      for (const age of rollChildren('senior', rng)) expect(age).toBeGreaterThanOrEqual(17)
    }
    expect([...counts].sort()).toEqual([0, 1, 2, 3])
  })
})

describe('familyProblems', () => {
  const none = { siblingsRoll: null, siblings: null, extendedFamilyRoll: null, grandparents: null, auntsAndUncles: null, cousins: null }

  test('nothing entered is fine', () => {
    expect(familyProblems(none, 'adult', [])).toEqual([])
  })

  test('counts must fit the row dice', () => {
    expect(familyProblems({ ...none, siblingsRoll: 11, siblings: 4 }, 'adult', [])).toEqual([])
    expect(familyProblems({ ...none, siblingsRoll: 11, siblings: 5 }, 'adult', [])).toEqual(['Siblings must be 1-4 on 1d4'])
    expect(familyProblems({ ...none, siblingsRoll: 10, siblings: 0 }, 'adult', [])).toEqual([])
    expect(familyProblems({ ...none, siblingsRoll: 10, siblings: 1 }, 'adult', [])).toEqual(['Siblings: the family roll gives none'])
    expect(familyProblems({ ...none, extendedFamilyRoll: 11, grandparents: 0, cousins: 4 }, 'adult', [])).toEqual([
      'Cousins must be 1-3 on 1d3',
    ])
  })

  test('children count and ages', () => {
    expect(familyProblems(none, 'adult', [1, 4, 2])).toEqual([])
    expect(familyProblems(none, 'adult', [1, 1, 1, 1])).toEqual(['At most 3 children on 1d4-1'])
    expect(familyProblems(none, 'adult', [5])).toEqual(["Each child's age must be 1-4 on 1d4"])
    expect(familyProblems(none, 'middleAged', [17])).toEqual([])
  })
})
