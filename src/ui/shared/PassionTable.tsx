import { PASSION_OBJECTS, type PassionObject } from '../../data/passions.ts'
import type { Characteristics, PassionChoice } from '../../engine/types.ts'
import { NumberInput } from './NumberInput.tsx'

interface Props {
  label: string
  passions: { passion: PassionChoice; value: number | null }[]
  characteristics: Characteristics | null
  /** Suggested subject per row, shown as a placeholder. */
  hints?: string[]
  /** Background Passions can be renamed and removed; cultural ones cannot. */
  editable?: boolean
  onChange: (passions: PassionChoice[]) => void
}

const needsSubject = (object: PassionObject | null, characteristic: 'POW' | 'CHA') =>
  object !== null && PASSION_OBJECTS[object].terms.some((t) => t.of === 'subject' && t.characteristic === characteristic)

/** Passions with subject, object type and the subject's characteristics where the formula needs them (R13). */
export function PassionTable({ label, passions, characteristics, hints = [], editable = false, onChange }: Props) {
  const list = passions.map((p) => p.passion)
  const set = (i: number, changes: Partial<PassionChoice>) => onChange(list.map((p, j) => (j === i ? { ...p, ...changes } : p)))

  return (
    <div className="table-scroll">
      <table className="table" aria-label={label}>
        <thead>
          <tr>
            <th>Passion</th>
            <th>Subject</th>
            <th>Type</th>
            <th>Subject's POW and CHA</th>
            <th className="num">Value</th>
            {editable && <th />}
          </tr>
        </thead>
        <tbody>
          {passions.map(({ passion, value }, i) => {
            const name = passion.verb || `Passion ${i + 1}`
            return (
              <tr key={i}>
                <td>
                  {editable ? (
                    <input type="text" aria-label={`Passion ${i + 1}`} placeholder="Loyalty, Love, Fear..." value={passion.verb} onChange={(e) => set(i, { verb: e.target.value })} />
                  ) : (
                    passion.verb
                  )}
                </td>
                <td>
                  <input type="text" aria-label={`${name} subject`} placeholder={hints[i]} value={passion.subject} onChange={(e) => set(i, { subject: e.target.value })} />
                </td>
                <td>
                  <select
                    aria-label={`${name} type`}
                    value={passion.object ?? ''}
                    onChange={(e) => set(i, { object: (e.target.value || null) as PassionObject | null })}
                  >
                    <option value="">Choose...</option>
                    {Object.entries(PASSION_OBJECTS).map(([key, def]) => (
                      <option key={key} value={key}>
                        {def.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="inline">
                    {needsSubject(passion.object, 'POW') && (
                      <NumberInput
                        aria-label={`${name} subject's POW`}
                        placeholder={characteristics ? String(characteristics.POW) : undefined}
                        value={passion.subjectPOW ?? null}
                        onChange={(v) => set(i, { subjectPOW: v ?? undefined })}
                      />
                    )}
                    {needsSubject(passion.object, 'CHA') && (
                      <NumberInput
                        aria-label={`${name} subject's CHA`}
                        placeholder={characteristics ? String(characteristics.CHA) : undefined}
                        value={passion.subjectCHA ?? null}
                        onChange={(v) => set(i, { subjectCHA: v ?? undefined })}
                      />
                    )}
                  </span>
                </td>
                <td className="num">{value ?? '-'}</td>
                {editable && (
                  <td>
                    <button type="button" className="button secondary" onClick={() => onChange(list.filter((_, j) => j !== i))}>
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
