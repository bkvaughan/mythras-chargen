import { useState } from 'react'
import { SAMPLE_COMBAT_STYLES } from '../../data/combatStyles.ts'
import { PROFESSIONAL_SKILLS } from '../../data/skills.ts'
import { ageCategory, bonusEligibleSkills } from '../../engine/bonus.ts'
import { heldProfessionalSkills, skillKey } from '../../engine/skills.ts'
import type { Hobby } from '../../engine/types.ts'
import { skillChoices } from '../../state/reducer.ts'
import { AllocationTable } from '../shared/AllocationTable.tsx'
import { CombatStyleEditor } from '../shared/CombatStyleEditor.tsx'
import { SkillPicks } from '../shared/SkillPicks.tsx'
import type { StepProps } from './types.ts'

const HOBBY_KINDS: { kind: Hobby['kind'] | 'none'; label: string }[] = [
  { kind: 'none', label: 'No hobby skill' },
  { kind: 'skill', label: 'A new professional skill' },
  { kind: 'style', label: 'A new Combat Style' },
]

export function BonusStep({ character, derived, dispatch }: StepProps) {
  const choices = skillChoices(character)
  const hobby = character.bonus?.hobby ?? null
  const age = ageCategory(character.concept.ageCategory)
  const setHobby = (h: Hobby | null) => dispatch({ type: 'setHobby', hobby: h })
  // The kind is chosen before the skill, and only a chosen skill is stored.
  const [kind, setKind] = useState<Hobby['kind'] | 'none'>(hobby?.kind ?? 'none')
  const chooseKind = (k: typeof kind) => {
    setKind(k)
    setHobby(k === 'style' ? { kind: 'style', style: { name: '', weapons: '', trait: null } } : null)
  }

  // A hobby is a skill the character does not have yet; specialised skills can always be taken anew (R7, R11).
  const held = heldProfessionalSkills({ ...choices, bonus: null }).map(skillKey)
  const hobbyOptions = PROFESSIONAL_SKILLS.filter((s) => s.specialised || !held.includes(s.name)).map((s) => ({ skill: s.name }))

  return (
    <>
      <h2>Bonus Skills</h2>
      <p className="hint">
        Spend {age.bonusSkillPoints} points for {/^[AEIOU]/.test(age.name) ? 'an' : 'a'} {age.name} character, at most +{age.maxSkillIncrease} on any one skill, on skills the
        character already has or on one new hobby skill. See Mythras p. 32.
      </p>

      <fieldset>
        <legend>Hobby skill</legend>
        {HOBBY_KINDS.map(({ kind: k, label }) => (
          <label className="choice" key={k}>
            <input
              type="radio"
              name="hobby"
              checked={kind === k}
              onChange={() => chooseKind(k)}
            />
            {label}
          </label>
        ))}
        {kind === 'skill' && (
          <SkillPicks
            options={hobbyOptions}
            picks={hobby?.kind === 'skill' ? [hobby.pick] : []}
            count={1}
            onChange={(picks) => setHobby(picks[0] ? { kind: 'skill', pick: picks[0] } : null)}
          />
        )}
        {hobby?.kind === 'style' && (
          <CombatStyleEditor
            id="hobby-style"
            style={hobby.style}
            names={SAMPLE_COMBAT_STYLES.map((s) => s.name)}
            onChange={(style) => setHobby({ kind: 'style', style })}
          />
        )}
      </fieldset>

      <p className="remaining">Bonus points left: {derived.pointsRemaining.bonus}</p>
      <AllocationTable
        label="Bonus skill points"
        stages
        keys={bonusEligibleSkills(choices)}
        points={character.bonus?.points ?? {}}
        skills={derived.skills}
        min={0}
        max={age.maxSkillIncrease}
        onChange={(key, points) => dispatch({ type: 'setBonusPoints', key, points })}
      />
    </>
  )
}
