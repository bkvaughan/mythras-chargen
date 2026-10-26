import { useState } from 'react'
import { COMBAT_STYLE_TRAITS } from '../../data/combatStyles.ts'
import type { CombatStyle } from '../../engine/types.ts'

interface Props {
  id: string
  style: CombatStyle
  /** Example names to choose from; any other name can be typed. */
  names: string[]
  onChange: (style: CombatStyle) => void
}

const CUSTOM = 'custom'

/** Name, free-text weapons and zero or one trait (R10). */
export function CombatStyleEditor({ id, style, names, onChange }: Props) {
  const set = (changes: Partial<CombatStyle>) => onChange({ ...style, ...changes })
  const trait = COMBAT_STYLE_TRAITS.find((t) => t.name === style.trait)
  // A name that is not one of the examples is a custom one; the flag keeps the box open while it is empty.
  const [customChosen, setCustomChosen] = useState(false)
  const custom = customChosen || (style.name !== '' && !names.includes(style.name))
  const chooseName = (value: string) => {
    setCustomChosen(value === CUSTOM)
    set({ name: value === CUSTOM ? '' : value })
  }
  return (
    <div className="field-row">
      <div className="field">
        <label htmlFor={`${id}-name`}>Combat Style name</label>
        <select id={`${id}-name`} value={custom ? CUSTOM : style.name} onChange={(e) => chooseName(e.target.value)}>
          <option value="">Choose...</option>
          {names.map((n) => (
            <option key={n}>{n}</option>
          ))}
          <option value={CUSTOM}>Custom name</option>
        </select>
        {custom && (
          <input type="text" aria-label="Custom name" value={style.name} onChange={(e) => set({ name: e.target.value })} />
        )}
      </div>
      <div className="field">
        <label htmlFor={`${id}-weapons`}>Weapons</label>
        <input id={`${id}-weapons`} type="text" value={style.weapons} onChange={(e) => set({ weapons: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-trait`}>Trait</label>
        <select id={`${id}-trait`} value={style.trait ?? ''} onChange={(e) => set({ trait: e.target.value || null })}>
          <option value="">No trait</option>
          {COMBAT_STYLE_TRAITS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        {trait && (
          <span className="hint">
            {trait.summary}
            {trait.groupOnly && '; works only if the whole group has it'}
          </span>
        )}
      </div>
    </div>
  )
}
