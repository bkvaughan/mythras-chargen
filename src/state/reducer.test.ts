import { describe, expect, test } from 'vitest'
import { ANATHAYM, ANATHAYM_CAREER, ANATHAYM_CULTURE } from '../engine/testFixtures.ts'
import { newCharacter, type Character } from './character.ts'
import { deriveCharacter, STEPS } from './derive.ts'
import { reducer, type Action } from './reducer.ts'

const run = (actions: Action[], from: Character = newCharacter()) => actions.reduce(reducer, from)

// Anathaym's rolls in the order rolled (p. 12), then assigned.
const ROLLED = { STR: 11, CON: 7, DEX: 13, POW: 9, CHA: 16, SIZ: 10, INT: 14 }

/** Anathaym built step by step through the wizard's actions. */
const anathaymActions: Action[] = [
  { type: 'setConcept', changes: { name: 'Anathaym', ageCategory: 'adult', age: 20, method: 'rollAndAssign' } },
  { type: 'setCharacteristics', rolled: ROLLED, values: ANATHAYM },
  { type: 'setAttributes', changes: { frame: 'lithe', heightCm: 165, weightKg: 47 } },
  { type: 'chooseCulture', culture: 'civilised' },
  {
    type: 'updateCulture',
    changes: {
      professional: ANATHAYM_CULTURE.professional,
      combatStyle: ANATHAYM_CULTURE.combatStyle,
      passions: ANATHAYM_CULTURE.passions,
      nativeTongue: 'Meerish',
    },
  },
  ...Object.entries(ANATHAYM_CULTURE.points).map(([key, points]): Action => ({ type: 'setCulturePoints', key, points })),
  { type: 'setBackground', changes: { socialClassRoll: 97, moneyRoll: 9, events: [37], parentsRoll: 37, siblingsRoll: 19, siblings: 1 } },
  { type: 'chooseCareer', career: 'warrior' },
  { type: 'updateCareer', changes: { professional: ANATHAYM_CAREER.professional, styles: ANATHAYM_CAREER.styles } },
  ...Object.entries(ANATHAYM_CAREER.points).map(([key, points]): Action => ({ type: 'setCareerPoints', key, points })),
  ...['Perception', 'Stealth', 'Influence', 'Ride', 'Swim', 'Brawn', 'Dance', 'Sing', 'First Aid', 'Boating'].map(
    (key): Action => ({ type: 'setBonusPoints', key, points: 15 }),
  ),
]

describe('building a character through actions', () => {
  const anathaym = run(anathaymActions)
  const derived = deriveCharacter(anathaym)

  test('every step is complete', () => {
    for (const step of STEPS) expect(derived.steps[step].problems, step).toEqual([])
    expect(derived.steps.ageing.applies).toBe(false)
  })

  test('derived values match the book', () => {
    expect(derived.attributes?.initiative).toBe(15)
    expect(derived.money).toBe(3375)
    expect(derived.socialClass?.name).toBe('Aristocracy')
    expect(derived.skills.find((s) => s.key === 'Combat Style (Meerish Slinger)')?.total).toBe(52)
    expect(derived.skills.find((s) => s.key === 'Perception')?.total).toBe(36)
    expect(derived.pointsRemaining).toEqual({ culture: 0, career: 0, bonus: 0 })
  })

  test('Passion values', () => {
    // Loyalty (Meeros), a place: 30 + POW 7 + INT 14.
    expect(derived.passions.map((p) => p.value)).toEqual([51, 46, 46])
  })
})

describe('actions', () => {
  test('culture skills start at the minimum (R4) and cannot drop below an entry', () => {
    const c = run([{ type: 'chooseCulture', culture: 'civilised' }])
    expect(c.culture?.points).toEqual({ Conceal: 5, Deceit: 5, Drive: 5, Influence: 5, Insight: 5, Locale: 5, Willpower: 5 })
    const picked = run([{ type: 'updateCulture', changes: { professional: [{ skill: 'Courtesy' }] } }], c)
    expect(picked.culture?.points.Courtesy).toBe(5)
    expect(run([{ type: 'setCulturePoints', key: 'Conceal', points: 0 }], c).culture?.points.Conceal).toBe(5)
    expect(run([{ type: 'setCulturePoints', key: 'Conceal', points: 3 }], c).culture?.points.Conceal).toBe(3)
  })

  test('setting points to 0 removes the entry', () => {
    const c = run([
      { type: 'chooseCareer', career: 'warrior' },
      { type: 'setCareerPoints', key: 'Athletics', points: 0 },
    ], run(anathaymActions))
    expect(c.career?.points.Athletics).toBeUndefined()
  })

  test('choosing a culture prefills its Passion verbs', () => {
    const c = run([{ type: 'chooseCulture', culture: 'barbarian' }])
    expect(c.culture?.passions.map((p) => p.verb)).toEqual(['Loyalty', 'Love', 'Hate'])
  })

  test('choosing a career sets up its combat style slots (R9)', () => {
    const warrior = run(anathaymActions.slice(0, 5).concat({ type: 'chooseCareer', career: 'warrior' }))
    expect(warrior.career?.styles).toEqual([{ use: 'cultural' }, { use: 'new', style: { name: '', weapons: '', trait: null } }])
    const noStyle = run([{ type: 'chooseCulture', culture: 'civilised' }, { type: 'chooseCareer', career: 'mystic' }])
    expect(noStyle.career?.styles).toEqual([{ use: 'new', style: { name: '', weapons: '', trait: null } }])
  })

  test('reset starts a new character', () => {
    expect(run([...anathaymActions, { type: 'reset' }])).toEqual(newCharacter())
  })

  test('load replaces the character', () => {
    const anathaym = run(anathaymActions)
    expect(run([{ type: 'load', character: anathaym }])).toEqual(anathaym)
  })
})

describe('invalidation', () => {
  const anathaym = run(anathaymActions)

  test('changing culture resets culture choices but keeps characteristics and an allowed career', () => {
    const c = run([{ type: 'chooseCulture', culture: 'barbarian' }], anathaym)
    expect(c.culture?.points).toEqual({ Athletics: 5, Brawn: 5, Endurance: 5, 'First Aid': 5, Locale: 5, Perception: 5 })
    expect(c.characteristics).toEqual(anathaym.characteristics)
    expect(c.career?.career).toBe('warrior')
    // Career points stay on Warrior skills; the Meerish Slinger style left with the old culture.
    expect(c.career?.points['Combat Style (Meerish Slinger)']).toBeUndefined()
    expect(c.career?.points.Athletics).toBe(10)
  })

  test('changing to a culture without the career clears the career', () => {
    const agent = run([{ type: 'chooseCareer', career: 'agent' }], anathaym)
    expect(run([{ type: 'chooseCulture', culture: 'primitive' }], agent).career).toBeNull()
  })

  test('removing a skill drops its points at every stage', () => {
    const c = run([{ type: 'updateCulture', changes: { professional: ANATHAYM_CULTURE.professional.slice(0, 2) } }], anathaym)
    expect(c.culture?.points.Streetwise).toBeUndefined()
    expect(c.culture?.points.Courtesy).toBe(15)
  })

  test('editing a specialisation keeps its points', () => {
    const professional = [ANATHAYM_CULTURE.professional[0], { skill: 'Lore', specialisation: 'Geograph' }, ANATHAYM_CULTURE.professional[2]]
    const c = run([{ type: 'updateCulture', changes: { professional } }], anathaym)
    expect(c.culture?.points['Lore (Geograph)']).toBe(10)
    expect(c.culture?.points['Lore (Geography)']).toBeUndefined()
  })

  test('renaming a combat style keeps its points at every stage', () => {
    const combatStyle = { ...ANATHAYM_CULTURE.combatStyle!, name: 'Meeros Slinger' }
    const c = run([{ type: 'updateCulture', changes: { combatStyle } }], anathaym)
    expect(c.culture?.points['Combat Style (Meeros Slinger)']).toBe(10)
    expect(c.career?.points['Combat Style (Meeros Slinger)']).toBe(15)
  })

  test('a new generation method clears the characteristics', () => {
    const c = run([{ type: 'setConcept', changes: { method: 'pointsBuild' } }], anathaym)
    expect(c.characteristics).toEqual({ rolled: null, values: null })
    expect(run([{ type: 'setConcept', changes: { name: 'Ana' } }], anathaym).characteristics).toEqual(anathaym.characteristics)
  })

  test('a new age category clears an age outside it and trims background events', () => {
    const c = run([{ type: 'setConcept', changes: { ageCategory: 'young' } }], anathaym)
    expect(c.concept.age).toBeNull()
    expect(c.background.events).toEqual([])
  })

  test('typing an age keeps the partial value', () => {
    expect(run([{ type: 'setConcept', changes: { age: 2 } }], anathaym).concept.age).toBe(2)
  })

  test('Ageing rolls beyond the bands the age passes are ignored', () => {
    const rolls = [{ endurance: { d100: 1 }, willpower: { d100: 1 } }, { endurance: { d100: 1 }, willpower: { d100: 1 } }]
    const senior = run(
      [
        { type: 'setConcept', changes: { ageCategory: 'senior', age: 55 } },
        { type: 'setAgeing', rolls },
      ],
      anathaym,
    )
    expect(deriveCharacter(senior).ageing?.outcomes).toHaveLength(2)
    const younger = run([{ type: 'setConcept', changes: { age: 45 } }], senior)
    expect(deriveCharacter(younger).ageing?.outcomes).toHaveLength(1)
    expect(deriveCharacter(younger).steps.ageing.problems).toEqual([])
  })

  test('children are cleared unless the character is married (R21)', () => {
    // Base Influence 18: a roll of 2 means married, 3 betrothed.
    const married = run([{ type: 'setBackground', changes: { marriageRoll: 2, children: [3] } }], anathaym)
    expect(married.background.children).toEqual([3])
    expect(run([{ type: 'setBackground', changes: { marriageRoll: 3 } }], married).background.children).toEqual([])
  })

  test('a new family roll clears its counts unless they come with it', () => {
    const family = run([{ type: 'setBackground', changes: { siblingsRoll: 50, siblings: 4, extendedFamilyRoll: 50, cousins: 2 } }])
    expect(family.background.siblings).toBe(4)
    const rerolled = run([{ type: 'setBackground', changes: { siblingsRoll: 95, extendedFamilyRoll: 95 } }], family)
    expect(rerolled.background.siblings).toBeNull()
    expect(rerolled.background.cousins).toBeNull()
    expect(run([{ type: 'setBackground', changes: { siblingsRoll: 95, siblings: 9 } }], family).background.siblings).toBe(9)
    expect(run([{ type: 'setBackground', changes: { siblingsRoll: 50 } }], family).background.siblings).toBe(4)
  })
})

describe('Ageing in the derived view', () => {
  test('losses lower the derived characteristics and the step needs the rolls', () => {
    const anathaym = run(anathaymActions)
    const old = run([{ type: 'setConcept', changes: { ageCategory: 'middleAged', age: 42 } }], anathaym)
    expect(deriveCharacter(old).steps.ageing.problems).toEqual(['Make the Ageing rolls for 1 age bands'])
    const aged = run([{ type: 'setAgeing', rolls: [{ endurance: { d100: 99, effect: 3, loss: 2 }, willpower: { d100: 1 } }] }], old)
    const derived = deriveCharacter(aged)
    expect(derived.steps.ageing.complete).toBe(true)
    expect(derived.characteristics?.CON).toBe(11)
    expect(aged.characteristics.values?.CON).toBe(13)
  })
})

test('illegal characteristics derive nothing instead of failing', () => {
  const c = run([
    { type: 'setConcept', changes: { method: 'pointsBuild' } },
    { type: 'setCharacteristics', rolled: null, values: { ...ANATHAYM, CON: 40 } },
  ])
  const derived = deriveCharacter(c)
  expect(derived.attributes).toBeNull()
  expect(derived.steps.characteristics.complete).toBe(false)
  expect(derived.steps.attributes.problems).toEqual(['Set the characteristics first'])
})
