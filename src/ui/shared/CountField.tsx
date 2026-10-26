import type { Dice } from '../../data/types.ts'
import { diceRange, roll } from '../../engine/dice.ts'
import { NumberInput } from './NumberInput.tsx'

/** A number rolled on `dice` or entered by hand. */
export function CountField({ label, dice, value, onChange }: { label: string; dice: Dice; value: number | null; onChange: (v: number | null) => void }) {
  const range = diceRange(dice)
  return (
    <label className="choice">
      {label}
      <NumberInput
        min={range.min}
        max={range.max}
        value={value}
        aria-invalid={value !== null && (value < range.min || value > range.max)}
        onChange={onChange}
      />
      <button type="button" className="button secondary" onClick={() => onChange(roll(dice, Math.random))}>
        Roll {dice}
      </button>
    </label>
  )
}
