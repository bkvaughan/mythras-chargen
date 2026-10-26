import { describe, expect, test } from 'vitest'
import type { AgeCategory } from '../data/age.ts'
import { ageProblems, heightWeightProblems } from './concept.ts'

describe('age in years (R16)', () => {
  test.each<[AgeCategory, number, number]>([
    ['young', 11, 16],
    ['adult', 17, 27],
    ['middleAged', 28, 43],
    ['senior', 44, 64],
    ['old', 65, 90],
  ])('%s is %i-%i', (category, min, max) => {
    expect(ageProblems(category, min)).toEqual([])
    expect(ageProblems(category, max)).toEqual([])
    expect(ageProblems(category, min - 1)).toHaveLength(1)
    expect(ageProblems(category, max + 1)).toHaveLength(1)
  })

  test('no age yet', () => {
    expect(ageProblems('adult', null)).toEqual(['Roll or enter an age between 17 and 27 for the Adult age category'])
  })
})

describe('height and weight', () => {
  test('within the SIZ and frame range', () => {
    expect(heightWeightProblems(10, 'lithe', 165, 47)).toEqual([])
    expect(heightWeightProblems(10, 'lithe', 166, 51)).toEqual([
      'Height must be 161-165 cm for SIZ 10',
      'Weight must be 46-50 kg for SIZ 10 and a lithe frame',
    ])
    expect(heightWeightProblems(10, null, null, null)).toEqual(['Choose a frame'])
  })
})
