import { AGEING_EFFECTS, DIFFICULTY_GRADES } from '../../data/age.ts'
import { CHARACTERISTICS } from '../../data/characteristics.ts'
import { ageingBands, rollAgeing, type AgeingBandRolls, type AgeingOutcome, type AgeingRoll } from '../../engine/ageing.ts'
import { diceRange } from '../../engine/dice.ts'
import { NumberInput } from '../shared/NumberInput.tsx'
import type { StepProps } from './types.ts'

type SkillName = 'endurance' | 'willpower'
const SKILLS: { key: SkillName; name: 'Endurance' | 'Willpower' }[] = [
  { key: 'endurance', name: 'Endurance' },
  { key: 'willpower', name: 'Willpower' },
]
const LOSS = diceRange(AGEING_EFFECTS.lossDice)

/** A typed value outside its dice is not kept, so the engine only ever sees legal rolls. */
const within = (v: number | null, min: number, max: number) => (v !== null && v >= min && v <= max ? v : undefined)

function resultText(outcome: AgeingOutcome['rolls'][number]): string {
  if (outcome.success) return 'Success'
  return outcome.lost ? `Failure: -${outcome.lost.amount} ${outcome.lost.characteristic}` : 'Failure'
}

export function AgeingStep({ character, derived, dispatch }: StepProps) {
  const age = character.concept.age
  const base = character.characteristics.values
  if (age === null || !base || !derived.characteristics) {
    return (
      <>
        <h2>Ageing</h2>
        <p>Complete the earlier steps first.</p>
      </>
    )
  }
  const bands = ageingBands(age)
  const rolls = character.ageing
  const outcomes = derived.ageing?.outcomes ?? []
  const setRoll = (band: number, skill: SkillName, changes: Partial<AgeingRoll>) =>
    dispatch({ type: 'setAgeing', rolls: rolls.map((r, i): AgeingBandRolls => (i === band ? { ...r, [skill]: { ...r[skill], ...changes } } : r)) })

  return (
    <>
      <h2>Ageing</h2>
      <p className="hint">
        At {age} the character has passed {bands.length} age band{bands.length === 1 ? '' : 's'}. Each band makes an Endurance and a Willpower
        roll at its grade, using the skills as they stand after the bonus points. A failed roll costs 1d3 points from a characteristic picked
        by 1d6. Roll here, then type over any result to use your own dice. See Mythras p. 71.
      </p>
      <button type="button" className="button" onClick={() => dispatch({ type: 'setAgeing', rolls: rollAgeing(age, Math.random) })}>
        {rolls.length >= bands.length ? 'Roll again' : 'Roll Ageing'}
      </button>

      {rolls.length >= bands.length && (
        <div className="table-scroll">
          <table className="table spaced" aria-label="Ageing rolls">
            <thead>
              <tr>
                <th>Roll</th>
                <th className="num">Target</th>
                <th>d100</th>
                <th>Result</th>
                <th>1d6</th>
                <th>{AGEING_EFFECTS.lossDice}</th>
              </tr>
            </thead>
            {/* One body per band, headed by its name and grade */}
            {bands.map((band, i) => (
              <tbody key={band.name}>
                <tr className="band-row">
                  <th colSpan={6} scope="rowgroup">
                    {band.name} ({DIFFICULTY_GRADES[band.grade].name})
                  </th>
                </tr>
                {SKILLS.map(({ key, name }, j) => {
                  const entry = rolls[i][key]
                  const outcome = outcomes[i]?.rolls[j]
                  const label = `${band.name} ${name}`
                  return (
                    <tr key={label}>
                      <td>{name}</td>
                      <td className="num">{outcome?.target ?? 'Automatic failure'}</td>
                      <td>
                        <NumberInput
                          aria-label={`${label} d100`}
                          min={1}
                          max={100}
                          value={entry.d100}
                          onChange={(v) => {
                            const d100 = within(v, 1, 100)
                            if (d100 !== undefined) setRoll(i, key, { d100 })
                          }}
                        />
                      </td>
                      <td>{outcome && resultText(outcome)}</td>
                      <td>
                        {outcome && !outcome.success && (
                          <NumberInput
                            aria-label={`${label} effect`}
                            min={1}
                            max={6}
                            value={entry.effect ?? null}
                            onChange={(v) => setRoll(i, key, { effect: within(v, 1, 6) })}
                          />
                        )}
                      </td>
                      <td>
                        {outcome && !outcome.success && (
                          <NumberInput
                            aria-label={`${label} loss`}
                            min={LOSS.min}
                            max={LOSS.max}
                            value={entry.loss ?? null}
                            onChange={(v) => setRoll(i, key, { loss: within(v, LOSS.min, LOSS.max) })}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}

      <h3>Characteristics after Ageing</h3>
      <table className="table" aria-label="Characteristics after Ageing">
        <thead>
          <tr>
            <th>Characteristic</th>
            <th className="num">Before</th>
            <th className="num">After</th>
          </tr>
        </thead>
        <tbody>
          {CHARACTERISTICS.map((c) => (
            <tr key={c}>
              <td>{c}</td>
              <td className="num">{base[c]}</td>
              <td className="num">{derived.characteristics![c]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
