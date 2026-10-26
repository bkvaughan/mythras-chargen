import { CAREER_ALLOCATION, CAREERS } from '../../data/careers.ts'
import { SAMPLE_COMBAT_STYLES } from '../../data/combatStyles.ts'
import { CULTURES } from '../../data/cultures.ts'
import type { CareerId, CareerStyleSlot } from '../../data/types.ts'
import { availableCareers, careerEligibleSkills } from '../../engine/career.ts'
import type { CombatStyle, SlotChoice } from '../../engine/types.ts'
import { AllocationTable } from '../shared/AllocationTable.tsx'
import { CombatStyleEditor } from '../shared/CombatStyleEditor.tsx'
import { SkillPicks } from '../shared/SkillPicks.tsx'
import { SkillTable } from '../shared/SkillTable.tsx'
import type { StepProps } from './types.ts'

const EMPTY_STYLE: CombatStyle = { name: '', weapons: '', trait: null }

export function CareerStep({ character, derived, dispatch }: StepProps) {
  const culture = character.culture
  if (!culture) {
    return (
      <>
        <h2>Career</h2>
        <p>Choose a culture first.</p>
      </>
    )
  }
  const career = character.career
  const def = career && CAREERS[career.career]
  // Career styles can take any of the culture's example names or the book's sample styles.
  const styleNames = [...new Set([...CULTURES[culture.culture].combatStyleNames, ...SAMPLE_COMBAT_STYLES.map((s) => s.name)])]
  const setSlot = (i: number, choice: SlotChoice) =>
    career && dispatch({ type: 'updateCareer', changes: { styles: career.styles.map((s, j) => (j === i ? choice : s)) } })

  return (
    <>
      <h2>Career</h2>
      <p className="hint">The career the character followed after childhood. Changing the career clears these choices; see Mythras pp. 26-31.</p>

      <div className="field">
        <label htmlFor="career">Career</label>
        <select
          id="career"
          value={career?.career ?? ''}
          onChange={(e) => e.target.value && dispatch({ type: 'chooseCareer', career: e.target.value as CareerId })}
        >
          <option value="">Choose...</option>
          {availableCareers(culture.culture).map((id) => (
            <option key={id} value={id}>
              {CAREERS[id].name} (p. {CAREERS[id].page - 1})
            </option>
          ))}
        </select>
        <span className="hint">Only the careers open to a {CULTURES[culture.culture].name} character are listed.</span>
      </div>

      {career && def && (
        <>
          <h3>Standard Skills</h3>
          <p>{def.standardSkills.join(', ')}</p>

          <h3>Professional Skills</h3>
          <p className="hint">
            Choose up to {CAREER_ALLOCATION.professionalPicks}. A professional skill from the culture step can be chosen again to add career
            points to it.
          </p>
          <SkillPicks
            options={def.professionalSkills}
            picks={career.professional}
            count={CAREER_ALLOCATION.professionalPicks}
            onChange={(professional) => dispatch({ type: 'updateCareer', changes: { professional } })}
          />

          {def.combatStyles.length > 0 && <h3>Combat Styles</h3>}
          {def.combatStyles.map((slot, i) => (
            <StyleSlot
              key={`${career.career}-${i}`}
              id={`career-style-${i}`}
              slot={slot}
              choice={career.styles[i]}
              cultural={culture.combatStyle}
              names={styleNames}
              onChange={(choice) => setSlot(i, choice)}
            />
          ))}

          <h3>Skill Points</h3>
          <p className="hint">
            Spend all {CAREER_ALLOCATION.pool} points, at most {CAREER_ALLOCATION.max} on any one skill below. Skills can be left at 0.
          </p>
          <p className="remaining">Career points left: {derived.pointsRemaining.career}</p>
          <AllocationTable
            label="Career skill points"
            keys={careerEligibleSkills(culture, career)}
            points={career.points}
            skills={derived.skills}
            min={0}
            max={CAREER_ALLOCATION.max}
            onChange={(key, points) => dispatch({ type: 'setCareerPoints', key, points })}
          />

          <details>
            <summary>All skills so far</summary>
            <SkillTable skills={derived.skills} />
          </details>
        </>
      )}
    </>
  )
}

interface SlotProps {
  id: string
  slot: CareerStyleSlot
  choice: SlotChoice
  cultural: CombatStyle | null
  names: string[]
  onChange: (choice: SlotChoice) => void
}

/** One career combat style slot (R9): the cultural style, or a newly defined one. */
function StyleSlot({ id, slot, choice, cultural, names, onChange }: SlotProps) {
  // A Cultural Style slot defines a new style only when the culture step took none.
  const canUseCultural = slot.kind !== 'new' && cultural !== null
  const canDefine = slot.kind !== 'cultural' || cultural === null
  return (
    <fieldset>
      <legend>{slot.label}</legend>
      {slot.kind !== 'new' && (
        <>
          <label className="choice">
            <input type="radio" name={id} checked={choice.use === 'cultural'} disabled={!canUseCultural} onChange={() => onChange({ use: 'cultural' })} />
            {cultural ? `Use the cultural style, ${cultural.name}` : 'Use the cultural style (none was taken at the culture step)'}
          </label>
          <label className="choice">
            <input
              type="radio"
              name={id}
              checked={choice.use === 'new'}
              disabled={!canDefine}
              onChange={() => onChange({ use: 'new', style: EMPTY_STYLE })}
            />
            Define a new style
          </label>
        </>
      )}
      {choice.use === 'new' && <CombatStyleEditor id={id} style={choice.style} names={names} onChange={(style) => onChange({ use: 'new', style })} />}
    </fieldset>
  )
}
