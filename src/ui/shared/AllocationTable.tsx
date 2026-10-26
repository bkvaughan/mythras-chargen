import type { SkillRow } from '../../engine/skills.ts'
import type { Allocation } from '../../engine/types.ts'
import { NumberInput } from './NumberInput.tsx'

interface Props {
  label: string
  keys: string[]
  points: Allocation
  skills: SkillRow[]
  min: number
  max: number
  onChange: (key: string, points: number) => void
}

/** Points per skill for one stage, with base and running total. */
export function AllocationTable({ label, keys, points, skills, min, max, onChange }: Props) {
  return (
    <table className="table" aria-label={label}>
      <thead>
        <tr>
          <th>Skill</th>
          <th className="num">Base</th>
          <th className="num">Points</th>
          <th className="num">Total</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => {
          const row = skills.find((r) => r.key === key)
          const value = points[key] ?? 0
          return (
            <tr key={key}>
              <td>{key}</td>
              <td className="num">{row?.base ?? '-'}</td>
              <td className="num">
                <NumberInput
                  aria-label={`${key} points`}
                  min={min}
                  max={max}
                  value={value}
                  // Zero reads as not yet allocated, so only a started allocation is marked wrong.
                  aria-invalid={value !== 0 && (value < min || value > max)}
                  onChange={(v) => onChange(key, v ?? 0)}
                />
              </td>
              <td className="num">{row?.total ?? '-'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
