import { describe, expect, test } from 'vitest'
import { availableCareers, careerProblems } from './career.ts'
import { ANATHAYM_CAREER, ANATHAYM_CULTURE } from './testFixtures.ts'
import type { CareerChoices, CultureChoices } from './types.ts'

const culture = ANATHAYM_CULTURE
const career = ANATHAYM_CAREER
const noStyle: CultureChoices = { ...culture, combatStyle: null }
const infantry = { name: 'Meerish Infantry', weapons: '', trait: null }
const militia = { name: 'Town Militia', weapons: '', trait: null }

describe('careerProblems', () => {
  test('needs a culture and a career', () => {
    expect(careerProblems(null, career)).toEqual(['Choose a culture first'])
    expect(careerProblems(culture, null)).toEqual(['Choose a career'])
  })

  test('careers are filtered by culture', () => {
    expect(availableCareers('primitive')).not.toContain('agent')
    expect(careerProblems({ ...culture, culture: 'primitive' }, { ...career, career: 'sorcerer', styles: [], professional: [] })).toContain(
      'Sorcerer is not available to a Primitive character',
    )
  })

  test('up to three professional skills, with the career-fixed specialisation', () => {
    expect(careerProblems(culture, { ...career, professional: [...career.professional, { skill: 'Oratory' }] })).toContain(
      'Choose at most 3 professional skills',
    )
    expect(
      careerProblems(culture, { ...career, professional: [{ skill: 'Lore', specialisation: 'Geography' }], points: career.points }),
    ).toContain('Lore must be Lore (Military History) or Lore (Strategy and Tactics)')
    expect(careerProblems(culture, { ...career, professional: [{ skill: 'Seduction' }] })).toContain(
      'Seduction is not a Warrior professional skill',
    )
  })

  test('a professional skill from culture may be picked again (R8)', () => {
    const repeat: CareerChoices = {
      career: 'courtier',
      professional: [{ skill: 'Courtesy' }],
      styles: [],
      points: { Customs: 15, Dance: 15, Deceit: 15, Influence: 15, Insight: 15, Locale: 10, Perception: 5, Courtesy: 10 },
    }
    expect(careerProblems(culture, repeat)).toEqual([])
  })

  test('career skills take 0-15 points, all 100 spent', () => {
    expect(careerProblems(culture, { ...career, points: { ...career.points, Athletics: 16, Evade: 4 } })).toEqual([
      'Athletics can receive at most 15 career points',
    ])
    expect(careerProblems(culture, { ...career, points: { ...career.points, Athletics: 9 } })).toEqual([
      '1 career points left to spend',
    ])
    expect(careerProblems(culture, { ...career, points: { ...career.points, Athletics: 5, Stealth: 5 } })).toEqual([
      'Stealth cannot receive career points',
    ])
  })

  describe('combat style slots (R9)', () => {
    test('one choice per slot', () => {
      expect(careerProblems(culture, { ...career, styles: [{ use: 'cultural' }] })).toContain(
        "Define the career's 2 combat style slots",
      )
    })

    test('a Cultural Style slot uses the culture style if one was taken', () => {
      expect(careerProblems(culture, { ...career, styles: [{ use: 'new', style: militia }, career.styles[1]] })).toContain(
        'Cultural Style is the cultural combat style',
      )
    })

    test('a Cultural Style slot defines the style if the culture took none', () => {
      const styles: CareerChoices['styles'] = [{ use: 'new', style: militia }, { use: 'new', style: infantry }]
      const points = { ...career.points, 'Combat Style (Meerish Slinger)': 0, 'Combat Style (Town Militia)': 15 }
      expect(careerProblems(noStyle, { ...career, styles, points })).toEqual([])
      expect(careerProblems(noStyle, { ...career, styles: [{ use: 'cultural' }, career.styles[1]] })).toContain(
        'Cultural Style: no cultural combat style was taken, so define one here',
      )
    })

    test('a Speciality Style must be new and differently named', () => {
      expect(careerProblems(culture, { ...career, styles: [{ use: 'cultural' }, { use: 'cultural' }] })).toContain(
        'Speciality Style must be a new combat style',
      )
      const clash: CareerChoices['styles'] = [{ use: 'cultural' }, { use: 'new', style: { ...infantry, name: 'Meerish Slinger' } }]
      expect(careerProblems(culture, { ...career, styles: clash })).toContain('Each combat style needs a different name')
    })

    test('a Specific or Cultural slot accepts either', () => {
      const hunter = (styles: CareerChoices['styles'], styleKey: string): CareerChoices => ({
        career: 'hunter',
        professional: [],
        styles,
        points: { Athletics: 15, Endurance: 15, Locale: 15, Perception: 15, Ride: 15, Stealth: 15, [styleKey]: 10 },
      })
      expect(careerProblems(culture, hunter([{ use: 'cultural' }], 'Combat Style (Meerish Slinger)'))).toEqual([])
      const boar = { name: 'Boar Hunter', weapons: 'Spear', trait: null }
      expect(careerProblems(culture, hunter([{ use: 'new', style: boar }], 'Combat Style (Boar Hunter)'))).toEqual([])
    })
  })
})
