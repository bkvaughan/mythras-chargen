import type { SkillRef } from '../../data/types.ts'
import { findSkill } from '../../engine/skills.ts'
import type { SkillPick } from '../../engine/types.ts'

const refLabel = (ref: SkillRef) => (ref.specialisation ? `${ref.skill} (${ref.specialisation})` : ref.skill)
const matches = (ref: SkillRef, pick: SkillPick) =>
  ref.skill === pick.skill && (ref.specialisation === undefined || ref.specialisation === pick.specialisation)
/** Only a skill with a free-text specialisation can be picked more than once (R7). */
const repeatable = (ref: SkillRef) => !ref.specialisation && Boolean(findSkill(ref.skill)?.specialised)

interface Props {
  options: SkillRef[]
  picks: SkillPick[]
  count: number
  onChange: (picks: SkillPick[]) => void
}

/** `count` professional skill picks; specialised skills take a free-text specialisation (R7). */
export function SkillPicks({ options, picks, count, onChange }: Props) {
  const choose = (i: number, refIndex: string) => {
    if (refIndex === '') return onChange(picks.filter((_, j) => j !== i))
    const ref = options[Number(refIndex)]
    const pick: SkillPick = ref.specialisation ? { skill: ref.skill, specialisation: ref.specialisation } : { skill: ref.skill }
    onChange(i < picks.length ? picks.map((p, j) => (j === i ? pick : p)) : [...picks, pick])
  }
  const specialise = (i: number, specialisation: string) => onChange(picks.map((p, j) => (j === i ? { ...p, specialisation } : p)))

  // Filled picks first, so an empty slot is always the next one.
  const slots = Array.from({ length: Math.min(count, picks.length + 1) }, (_, i) => i)
  return (
    <div className="picks">
      {slots.map((i) => {
        const pick = picks[i]
        const refIndex = pick ? options.findIndex((ref) => matches(ref, pick)) : -1
        const ref = options[refIndex]
        return (
          <div className="inline" key={i}>
            <select aria-label={`Professional skill ${i + 1}`} value={refIndex < 0 ? '' : refIndex} onChange={(e) => choose(i, e.target.value)}>
              <option value="">-</option>
              {options.map((o, j) =>
                j === refIndex || repeatable(o) || !picks.some((p, k) => k !== i && matches(o, p)) ? (
                  <option key={j} value={j}>
                    {refLabel(o)}
                  </option>
                ) : null,
              )}
            </select>
            {pick && findSkill(pick.skill)?.specialised && (
              <input
                type="text"
                aria-label={`Specialisation ${i + 1}`}
                placeholder={ref?.hint ?? 'Specialisation'}
                value={pick.specialisation ?? ''}
                readOnly={Boolean(ref?.specialisation)}
                onChange={(e) => specialise(i, e.target.value)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
