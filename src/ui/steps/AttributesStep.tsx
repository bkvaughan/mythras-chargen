import { HIT_LOCATIONS, type Frame } from '../../data/attributes.ts'
import { heightWeightRange, rollHeightWeight } from '../../engine/attributes.ts'
import { NumberInput } from '../shared/NumberInput.tsx'
import type { StepProps } from './types.ts'

const FRAMES: { frame: Frame; label: string; hint: string }[] = [
  { frame: 'lithe', label: 'Lithe', hint: 'slender, athletic or underweight' },
  { frame: 'medium', label: 'Medium', hint: 'average build' },
  { frame: 'heavy', label: 'Heavy', hint: 'broad shouldered, barrel chested or overweight' },
]

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

export function AttributesStep({ character, derived, dispatch }: StepProps) {
  const { attributes: a, characteristics: c } = derived
  if (!a || !c) {
    return (
      <>
        <h2>Attributes</h2>
        <p>Complete the characteristics first.</p>
      </>
    )
  }
  const { frame, heightCm, weightKg } = character.attributes
  const range = frame && heightWeightRange(c.SIZ, frame)
  const set = (changes: Partial<typeof character.attributes>) => dispatch({ type: 'setAttributes', changes })
  const outside = (v: number | null, r: [number, number] | undefined) => v !== null && r !== undefined && (v < r[0] || v > r[1])

  return (
    <>
      <h2>Attributes</h2>
      <p className="hint">Attributes follow from the characteristics; see Mythras pp. 8-10.</p>

      <table className="table" aria-label="Attributes">
        <tbody>
          <tr><td>Action Points</td><td className="num">{a.actionPoints}</td></tr>
          <tr><td>Damage Modifier</td><td className="num">{a.damageModifier}</td></tr>
          <tr><td>Experience Modifier</td><td className="num">{signed(a.experienceModifier)}</td></tr>
          <tr><td>Healing Rate</td><td className="num">{a.healingRate}</td></tr>
          <tr><td>Initiative Bonus</td><td className="num">{a.initiative}</td></tr>
          <tr><td>Luck Points</td><td className="num">{a.luckPoints}</td></tr>
          <tr><td>Magic Points</td><td className="num">{a.magicPoints}</td></tr>
          <tr><td>Movement Rate</td><td className="num">{a.movement} m</td></tr>
        </tbody>
      </table>

      <h3>Hit Points</h3>
      <table className="table" aria-label="Hit Points">
        <thead>
          <tr>
            <th>1d20</th>
            <th>Location</th>
            <th className="num">Hit Points</th>
          </tr>
        </thead>
        <tbody>
          {[...HIT_LOCATIONS].reverse().map((l) => (
            <tr key={l.location}>
              <td>{l.min === l.max ? l.min : `${l.min}-${l.max}`}</td>
              <td>{l.name}</td>
              <td className="num">{a.hitPoints[l.location]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Height and Weight</h3>
      <fieldset>
        <legend>Frame</legend>
        {FRAMES.map((f) => (
          <label className="choice" key={f.frame}>
            <input type="radio" name="frame" checked={frame === f.frame} onChange={() => set({ frame: f.frame })} />
            <span>
              {f.label} <span className="hint">{f.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {range && (
        <>
          <div className="field-row">
            <div className="field">
              <label htmlFor="height">Height (cm)</label>
              <NumberInput
                id="height"
                value={heightCm}
                min={range.heightCm[0]}
                max={range.heightCm[1]}
                aria-invalid={outside(heightCm, range.heightCm)}
                onChange={(v) => set({ heightCm: v })}
              />
              <span className="hint">
                {range.heightCm[0]}-{range.heightCm[1]} cm for SIZ {c.SIZ}
              </span>
            </div>
            <div className="field">
              <label htmlFor="weight">Weight (kg)</label>
              <NumberInput
                id="weight"
                value={weightKg}
                min={range.weightKg[0]}
                max={range.weightKg[1]}
                aria-invalid={outside(weightKg, range.weightKg)}
                onChange={(v) => set({ weightKg: v })}
              />
              <span className="hint">
                {range.weightKg[0]}-{range.weightKg[1]} kg for SIZ {c.SIZ}, {frame} frame
              </span>
            </div>
          </div>
          <button type="button" className="button secondary" onClick={() => set(rollHeightWeight(c.SIZ, frame, Math.random))}>
            Roll height and weight
          </button>
        </>
      )}
    </>
  )
}
