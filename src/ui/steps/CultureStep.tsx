import { CULTURE_ALLOCATION, CULTURES } from '../../data/cultures.ts'
import { CULTURE_SKILL_BONUS } from '../../data/skills.ts'
import { cultureEligibleSkills } from '../../engine/culture.ts'
import type { Character } from '../../state/character.ts'
import { AllocationTable } from '../shared/AllocationTable.tsx'
import { CombatStyleEditor } from '../shared/CombatStyleEditor.tsx'
import { PassionTable } from '../shared/PassionTable.tsx'
import { SkillPicks } from '../shared/SkillPicks.tsx'
import type { StepProps } from './types.ts'

type CultureState = NonNullable<Character['culture']>

export function CultureStep({ character, derived, dispatch }: StepProps) {
  const choices = character.culture
  const culture = choices && CULTURES[choices.culture]
  const update = (changes: Partial<Omit<CultureState, 'culture' | 'points'>>) => dispatch({ type: 'updateCulture', changes })

  return (
    <>
      <h2>Culture</h2>
      <p className="hint">
        The culture the character grew up in gives skills, a Combat Style and three Passions. Changing the culture clears these choices;
        see Mythras pp. 13-17.
      </p>

      <fieldset>
        <legend>Culture</legend>
        {Object.values(CULTURES).map((c) => (
          <label className="choice" key={c.id}>
            <input
              type="radio"
              name="culture"
              checked={choices?.culture === c.id}
              onChange={() => dispatch({ type: 'chooseCulture', culture: c.id })}
            />
            <span>
              {c.name} <span className="hint">p. {c.page - 1}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {choices && culture && (
        <>
          <h3>Standard Skills</h3>
          <p>{culture.standardSkills.join(', ')}</p>
          {culture.standardSkillChoice && (
            <fieldset>
              <legend>
                Choose {culture.standardSkillChoice.pick} of {culture.standardSkillChoice.options.join(', ')}
              </legend>
              {culture.standardSkillChoice.options.map((skill) => {
                const checked = choices.standardChoice.includes(skill)
                return (
                  <label className="choice" key={skill}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        update({ standardChoice: checked ? choices.standardChoice.filter((s) => s !== skill) : [...choices.standardChoice, skill] })
                      }
                    />
                    {skill}
                  </label>
                )
              })}
            </fieldset>
          )}

          <h3>Professional Skills</h3>
          <p className="hint">
            Choose {CULTURE_ALLOCATION.professionalPicks}. A specialised skill can be taken more than once with different specialisations.
          </p>
          <SkillPicks
            options={culture.professionalSkills}
            picks={choices.professional}
            count={CULTURE_ALLOCATION.professionalPicks}
            onChange={(professional) => update({ professional })}
          />

          <h3>Combat Style</h3>
          <label className="choice">
            <input
              type="checkbox"
              checked={choices.combatStyle !== null}
              onChange={() => update({ combatStyle: choices.combatStyle ? null : { name: '', weapons: '', trait: null } })}
            />
            Take a cultural Combat Style
          </label>
          {choices.combatStyle && (
            <>
              <p className="hint">Pick an example name or make one up, list its weapons, and choose up to one trait; see Mythras pp. 12 and 89.</p>
              <CombatStyleEditor
                id="culture-style"
                style={choices.combatStyle}
                names={culture.combatStyleNames}
                onChange={(combatStyle) => update({ combatStyle })}
              />
            </>
          )}

          <h3>Skill Points</h3>
          <p className="hint">
            Spend all {CULTURE_ALLOCATION.pool} points: {CULTURE_ALLOCATION.min} to {CULTURE_ALLOCATION.max} on every skill below.{' '}
            {CULTURE_SKILL_BONUS.skills.join(' and ')} gain +{CULTURE_SKILL_BONUS.bonus} on top.
          </p>
          <p>
            {derived.skills
              .filter((r) => CULTURE_SKILL_BONUS.skills.includes(r.key))
              .map((r) => `${r.key} ${r.total}%`)
              .join(', ')}
          </p>
          <p className="remaining">Culture points left: {derived.pointsRemaining.culture}</p>
          <AllocationTable
            label="Culture skill points"
            keys={cultureEligibleSkills(choices)}
            points={choices.points}
            skills={derived.skills}
            min={CULTURE_ALLOCATION.min}
            max={CULTURE_ALLOCATION.max}
            onChange={(key, points) => dispatch({ type: 'setCulturePoints', key, points })}
          />

          <div className="field">
            <label htmlFor="native-tongue">Native Tongue</label>
            <input
              id="native-tongue"
              type="text"
              placeholder="Name of the language"
              value={choices.nativeTongue}
              onChange={(e) => update({ nativeTongue: e.target.value })}
            />
          </div>

          <h3>Passions</h3>
          <p className="hint">Name the subject of each Passion and choose its type; the type sets the starting value. See Mythras p. 23.</p>
          <PassionTable
            label="Cultural Passions"
            passions={derived.passions.slice(0, choices.passions.length)}
            characteristics={derived.characteristics}
            hints={culture.passions.map((p) => p.subject)}
            onChange={(passions) => update({ passions })}
          />
        </>
      )}
    </>
  )
}
