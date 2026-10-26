import { CHARACTERISTIC_DICE, CHARACTERISTIC_NAMES, CHARACTERISTICS, POINTS_BUILD } from '../../data/characteristics.ts'
import type { Characteristic } from '../../data/types.ts'
import { rollCharacteristics } from '../../engine/characteristics.ts'
import { diceRange } from '../../engine/dice.ts'
import type { Characteristics } from '../../engine/types.ts'
import { NumberInput } from '../shared/NumberInput.tsx'
import type { StepProps } from './types.ts'

const minimums = (): Characteristics => {
  const result = {} as Characteristics
  for (const c of CHARACTERISTICS) result[c] = diceRange(CHARACTERISTIC_DICE[c]).min
  return result
}

export function CharacteristicsStep({ character, dispatch }: StepProps) {
  const { method } = character.concept
  return (
    <>
      <h2>Characteristics</h2>
      {method === null && <p>Choose how to generate characteristics in the Concept step first.</p>}
      {method === 'pointsBuild' && <PointsBuild character={character} dispatch={dispatch} />}
      {(method === 'rollInOrder' || method === 'rollAndAssign') && (
        <Rolled character={character} dispatch={dispatch} assign={method === 'rollAndAssign'} />
      )}
    </>
  )
}

type Props = Pick<StepProps, 'character' | 'dispatch'>

function Rolled({ character, dispatch, assign }: Props & { assign: boolean }) {
  const { rolled, values } = character.characteristics
  const set = (r: Characteristics, v: Characteristics) => dispatch({ type: 'setCharacteristics', rolled: r, values: v })
  // Entering a roll by hand restarts any assignment from the new rolls.
  const enterRoll = (c: Characteristic, value: number | null) => {
    if (!rolled || value === null) return
    const next = { ...rolled, [c]: value }
    set(next, next)
  }
  const swap = (a: Characteristic, b: Characteristic) => {
    if (!rolled || !values) return
    set(rolled, { ...values, [a]: values[b], [b]: values[a] })
  }

  return (
    <>
      <p className="hint">
        {assign
          ? 'Roll, then swap values between characteristics that share the same dice; see Mythras p. 8.'
          : 'Roll each characteristic and keep the results in order; see Mythras p. 8.'}{' '}
        To use your own dice, enter the results by hand.
      </p>
      <div className="inline">
        <button type="button" className="button" onClick={() => { const r = rollCharacteristics(Math.random); set(r, r) }}>
          {rolled ? 'Roll again' : 'Roll characteristics'}
        </button>
        {!rolled && (
          <button type="button" className="button secondary" onClick={() => set(minimums(), minimums())}>
            Enter my own rolls
          </button>
        )}
      </div>

      {rolled && values && (
        <table className="table spaced">
          <thead>
            <tr>
              <th>Characteristic</th>
              <th>Dice</th>
              <th>Rolled</th>
              {assign && <th className="num">Value</th>}
              {assign && <th>Swap with</th>}
            </tr>
          </thead>
          <tbody>
            {CHARACTERISTICS.map((c) => {
              const dice = CHARACTERISTIC_DICE[c]
              const range = diceRange(dice)
              const sameDice = CHARACTERISTICS.filter((o) => o !== c && CHARACTERISTIC_DICE[o] === dice)
              return (
                <tr key={c}>
                  <td>
                    <label htmlFor={`rolled-${c}`}>{CHARACTERISTIC_NAMES[c]} ({c})</label>
                  </td>
                  <td>{dice}</td>
                  <td>
                    <NumberInput
                      id={`rolled-${c}`}
                      min={range.min}
                      max={range.max}
                      value={rolled[c]}
                      aria-invalid={rolled[c] < range.min || rolled[c] > range.max}
                      onChange={(v) => enterRoll(c, v)}
                    />
                  </td>
                  {assign && <td className="num">{values[c]}</td>}
                  {assign && (
                    <td>
                      <select aria-label={`Swap ${c} with`} value="" onChange={(e) => swap(c, e.target.value as Characteristic)}>
                        <option value="">-</option>
                        {sameDice.map((o) => (
                          <option key={o} value={o}>
                            {o} ({values[o]})
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}

function PointsBuild({ character, dispatch }: Props) {
  const values = character.characteristics.values ?? POINTS_BUILD.min
  const remaining = POINTS_BUILD.pool - CHARACTERISTICS.reduce((sum, c) => sum + values[c], 0)
  const set = (c: Characteristic, v: number | null) =>
    dispatch({ type: 'setCharacteristics', rolled: null, values: { ...values, [c]: v ?? POINTS_BUILD.min[c] } })

  return (
    <>
      <p className="hint">
        Spend all {POINTS_BUILD.pool} points. Each characteristic is 3 to 18; SIZ and INT are at least 8; see Mythras p. 8.
      </p>
      <p className="remaining" role="status">
        Points remaining: {remaining}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Characteristic</th>
            <th>Range</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {CHARACTERISTICS.map((c) => (
            <tr key={c}>
              <td>
                <label htmlFor={`build-${c}`}>{CHARACTERISTIC_NAMES[c]} ({c})</label>
              </td>
              <td>
                {POINTS_BUILD.min[c]}-{POINTS_BUILD.max}
              </td>
              <td>
                <NumberInput
                  id={`build-${c}`}
                  min={POINTS_BUILD.min[c]}
                  max={POINTS_BUILD.max}
                  value={values[c]}
                  aria-invalid={values[c] < POINTS_BUILD.min[c] || values[c] > POINTS_BUILD.max}
                  onChange={(v) => set(c, v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
