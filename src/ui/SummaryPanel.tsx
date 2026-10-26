import { CAREERS } from '../data/careers.ts'
import { CHARACTERISTICS } from '../data/characteristics.ts'
import { CULTURES } from '../data/cultures.ts'
import type { Character } from '../state/character.ts'
import type { DerivedCharacter, StepId } from '../state/derive.ts'

const STAGE_POINTS: Partial<Record<StepId, { label: string; key: 'culture' | 'career' | 'bonus' }>> = {
  culture: { label: 'Culture points left', key: 'culture' },
  career: { label: 'Career points left', key: 'career' },
  bonus: { label: 'Bonus points left', key: 'bonus' },
}

/** Always-visible digest of the character and the points left in the current stage. */
export function SummaryPanel({ character, derived, step }: { character: Character; derived: DerivedCharacter; step: StepId }) {
  const { characteristics: c, attributes: a } = derived
  const stage = STAGE_POINTS[step]
  const remaining = stage && derived.pointsRemaining[stage.key]

  return (
    <aside className="summary panel" aria-label="Character summary">
      <h3>{character.concept.name.trim() || 'Unnamed character'}</h3>
      <p className="hint">
        {[character.culture && CULTURES[character.culture.culture].name, character.career && CAREERS[character.career.career].name]
          .filter(Boolean)
          .join(' ')}
      </p>

      {stage && remaining !== null && remaining !== undefined && (
        <p className="remaining" role="status">
          {stage.label}: {remaining}
        </p>
      )}

      <dl aria-label="Characteristics">
        {CHARACTERISTICS.map((k) => (
          <div key={k} className="pair">
            <dt>{k}</dt>
            <dd>{c ? c[k] : '-'}</dd>
          </div>
        ))}
      </dl>

      {a && (
        <dl aria-label="Key attributes">
          <dt>Action Points</dt>
          <dd>{a.actionPoints}</dd>
          <dt>Damage Modifier</dt>
          <dd>{a.damageModifier}</dd>
          <dt>Initiative Bonus</dt>
          <dd>{a.initiative}</dd>
          <dt>Luck Points</dt>
          <dd>{a.luckPoints}</dd>
          <dt>Magic Points</dt>
          <dd>{a.magicPoints}</dd>
        </dl>
      )}
    </aside>
  )
}
