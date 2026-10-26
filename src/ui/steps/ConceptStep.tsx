import { AGE_CATEGORIES, type AgeCategory } from '../../data/age.ts'
import type { GenerationMethod } from '../../data/characteristics.ts'
import { ageCategory } from '../../engine/bonus.ts'
import { diceRange, roll } from '../../engine/dice.ts'
import type { Character } from '../../state/character.ts'
import { NumberInput } from '../shared/NumberInput.tsx'
import type { StepProps } from './types.ts'

const METHODS: { method: GenerationMethod; label: string; hint: string }[] = [
  { method: 'rollInOrder', label: 'Dice roll, in order', hint: 'Roll each characteristic and keep the results as they fall.' },
  {
    method: 'rollAndAssign',
    label: 'Dice roll, assign',
    hint: 'Roll, then swap results between characteristics that use the same dice.',
  },
  { method: 'pointsBuild', label: 'Points build', hint: 'Spend 75 points: 3 to 18 each, at least 8 for SIZ and INT.' },
]

type TextField = 'name' | 'player' | 'gender' | 'handedness'
const TEXT_FIELDS: { field: TextField; label: string }[] = [
  { field: 'name', label: 'Character name' },
  { field: 'player', label: 'Player' },
  { field: 'gender', label: 'Gender' },
  { field: 'handedness', label: 'Handedness' },
]

export function ConceptStep({ character, dispatch }: StepProps) {
  const { concept } = character
  const set = (changes: Partial<Character['concept']>) => dispatch({ type: 'setConcept', changes })
  const category = ageCategory(concept.ageCategory)
  const range = diceRange(category.ageDice)
  const ageOutOfRange = concept.age !== null && (concept.age < range.min || concept.age > range.max)

  return (
    <>
      <h2>Concept</h2>
      <p className="hint">Decide what kind of character to play. Only the age and the generation method are needed now; see Mythras p. 36.</p>

      <div className="field-row">
        {TEXT_FIELDS.map(({ field, label }) => (
          <div className="field" key={field}>
            <label htmlFor={`concept-${field}`}>{label}</label>
            <input id={`concept-${field}`} type="text" value={concept[field]} onChange={(e) => set({ [field]: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="field">
        <label htmlFor="concept-description">Description</label>
        <textarea id="concept-description" rows={3} value={concept.description} onChange={(e) => set({ description: e.target.value })} />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="concept-age-category">Age category</label>
          <select
            id="concept-age-category"
            value={concept.ageCategory}
            onChange={(e) => set({ ageCategory: e.target.value as AgeCategory })}
          >
            {AGE_CATEGORIES.map((a) => (
              <option key={a.category} value={a.category}>
                {a.name} ({a.ageDice})
              </option>
            ))}
          </select>
          <span className="hint">
            Sets bonus skill points ({category.bonusSkillPoints}, at most +{category.maxSkillIncrease} per skill) and background events (
            {category.backgroundEvents}); see Mythras p. 32.
          </span>
        </div>
        <div className="field">
          <label htmlFor="concept-age">Age</label>
          <div className="inline">
            <NumberInput
              id="concept-age"
              min={range.min}
              max={range.max}
              value={concept.age}
              aria-invalid={ageOutOfRange}
              aria-describedby="concept-age-hint"
              onChange={(age) => set({ age })}
            />
            <button type="button" className="button secondary" onClick={() => set({ age: roll(category.ageDice, Math.random) })}>
              Roll {category.ageDice}
            </button>
          </div>
          <span className="hint" id="concept-age-hint">
            {range.min} to {range.max} years. Characters aged 40 or more make Ageing rolls; see Mythras p. 70.
          </span>
        </div>
      </div>

      <fieldset>
        <legend>Characteristics method</legend>
        {METHODS.map(({ method, label, hint }) => (
          <label className="choice" key={method}>
            <input
              type="radio"
              name="concept-method"
              value={method}
              checked={concept.method === method}
              onChange={() => set({ method })}
            />
            <span>
              {label} <span className="hint">{hint}</span>
            </span>
          </label>
        ))}
        <p className="hint">Changing the method clears the characteristics; see Mythras p. 8.</p>
      </fieldset>
    </>
  )
}
