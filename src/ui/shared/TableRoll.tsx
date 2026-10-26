import type { ReactNode } from 'react'
import type { D100Row } from '../../data/types.ts'
import { rollD100 } from '../../engine/dice.ts'
import { NumberInput } from './NumberInput.tsx'

// The book writes a roll of 100 as 00.
const d100Text = (n: number) => (n === 100 ? '00' : String(n).padStart(2, '0'))
const rowRange = (r: D100Row<unknown>) => (r.min === r.max ? d100Text(r.min) : `${d100Text(r.min)}-${d100Text(r.max)}`)

interface Props<T> {
  legend: string
  rows: D100Row<T>[]
  value: number | null
  describe: (result: T) => string
  onChange: (d100: number | null) => void
  /** Replaces the plain d100 roll, e.g. to re-roll repeated background events. */
  roll?: () => number
  children?: ReactNode
}

/** A d100 table result that can be rolled, entered from the player's own dice, or chosen. */
export function TableRoll<T>({ legend, rows, value, describe, onChange, roll = () => rollD100(Math.random), children }: Props<T>) {
  const row = value === null ? undefined : rows.find((r) => value >= r.min && value <= r.max)
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="inline">
        <label className="choice">
          d100
          <NumberInput min={1} max={100} value={value} onChange={(v) => onChange(v !== null && v >= 1 && v <= 100 ? v : null)} />
        </label>
        <button type="button" className="button secondary" onClick={() => onChange(roll())}>
          Roll d100
        </button>
        <select aria-label="Result" value={row?.min ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">Choose...</option>
          {rows.map((r) => (
            <option key={r.min} value={r.min}>
              {rowRange(r)}: {describe(r.result)}
            </option>
          ))}
        </select>
      </div>
      {children}
    </fieldset>
  )
}
