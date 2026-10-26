import { describe, expect, test } from 'vitest'
import { skillTable } from '../engine/skills.ts'
import { ANATHAYM, ANATHAYM_CHOICES } from '../engine/testFixtures.ts'
import { newCharacter, type Character } from './character.ts'
import { deriveCharacter } from './derive.ts'
import { backgroundNotes, sheetSkills } from './sheet.ts'

const keys = (rows: { key: string }[]) => rows.map((r) => r.key)

describe('sheetSkills', () => {
  const skills = sheetSkills(skillTable(ANATHAYM, { ...ANATHAYM_CHOICES, bonus: { hobby: { kind: 'skill', pick: { skill: 'Language', specialisation: 'Thennalt' } }, points: {} } }))

  test('groups skills the way the official sheet does', () => {
    expect(keys(skills.resistances)).toEqual(['Brawn', 'Endurance', 'Evade', 'Willpower'])
    expect(keys(skills.standard)).toHaveLength(17)
    expect(keys(skills.standard)).not.toContain('Native Tongue')
    expect(keys(skills.languages)).toEqual(['Native Tongue', 'Language (Thennalt)'])
    expect(keys(skills.professional)).toEqual([
      'Courtesy',
      'Lore (Geography)',
      'Streetwise',
      'Lore (Military History)',
      'Lore (Strategy and Tactics)',
      'Survival',
    ])
    expect(keys(skills.combatStyles)).toEqual(['Combat Style (Meerish Slinger)', 'Combat Style (Meerish Infantry)'])
    expect(skills.magic).toEqual([])
  })

  test('magic skills go in their own box', () => {
    const shaman = sheetSkills(
      skillTable(ANATHAYM, { culture: null, career: null, bonus: { hobby: { kind: 'skill', pick: { skill: 'Trance' } }, points: {} } }),
    )
    expect(keys(shaman.magic)).toEqual(['Trance'])
  })
})

describe('backgroundNotes', () => {
  const base = newCharacter()
  const c: Character = {
    ...base,
    characteristics: { rolled: ANATHAYM, values: ANATHAYM },
    culture: { culture: 'civilised', standardChoice: [], professional: [], combatStyle: null, points: {}, passions: [], nativeTongue: '' },
    background: {
      ...base.background,
      socialClassRoll: 97,
      events: [37],
      parentsRoll: 1,
      siblingsRoll: 5,
      extendedFamilyRoll: 50,
      cousins: 2,
      reputationRoll: 20,
      people: [{ kind: 'Rival', name: 'Xenos' }, { kind: 'Ally', name: '' }],
      marriageRoll: 2,
      children: [3, 1],
    },
  }

  test('one plain line per result, in sheet order', () => {
    expect(backgroundNotes(c, deriveCharacter(c))).toEqual([
      'Social class: Aristocracy. Several estates or businesses, costly goods and arms, many servants, the loyalty of a region.',
      'Background event: Scarred by a terrible attack; you may take a Fear Passion for what harmed you.',
      'Parents: Both parents living.',
      'Siblings: none.',
      'Extended family: grandparents 1d3-1, aunts and uncles 1d3, cousins 2.',
      'Reputation: Sound reputation, with a few secrets.',
      'Rival: Xenos; Ally: unnamed.',
      'Married, children aged 3, 1.',
    ])
  })

  test('nothing chosen gives no notes', () => {
    expect(backgroundNotes(base, deriveCharacter(base))).toEqual([])
  })
})
