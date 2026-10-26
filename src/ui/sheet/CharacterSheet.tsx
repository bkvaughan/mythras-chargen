import type { ReactNode } from 'react'
import { HIT_LOCATIONS } from '../../data/attributes.ts'
import { CAREERS } from '../../data/careers.ts'
import { CHARACTERISTIC_NAMES, CHARACTERISTICS } from '../../data/characteristics.ts'
import { COMBAT_STYLE_BASE } from '../../data/combatStyles.ts'
import { CULTURES } from '../../data/cultures.ts'
import type { BaseFormula } from '../../data/types.ts'
import { findSkill, heldCombatStyles, styleKey, type SkillRow } from '../../engine/skills.ts'
import type { Character } from '../../state/character.ts'
import type { DerivedCharacter } from '../../state/derive.ts'
import { skillChoices } from '../../state/reducer.ts'
import { backgroundNotes, sheetSkills } from '../../state/sheet.ts'
import './sheet.css'

// Laid out after the official Mythras character sheet (../character-sheet-print.pdf):
// two pages, boxes titled on their top border, write-in space for what v1 does not cover.

const formulaText = ([a, b]: BaseFormula) => (a === b ? `${a} x2` : `${a}+${b}`)
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

function formula(row: SkillRow): string {
  if (row.kind === 'combatStyle') return formulaText(COMBAT_STYLE_BASE)
  return formulaText(findSkill(row.skill)!.base)
}

function Box({ title, className = '', children }: { title: string; className?: string; children?: ReactNode }) {
  return (
    <section className={`sheet-box ${className}`} aria-label={title}>
      <h3 className="sheet-title">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={`sheet-field${wide ? ' wide' : ''}`}>
      <span className="sheet-label">{label}:</span> <span className="sheet-value">{value}</span>
    </div>
  )
}

/** Empty rows to write in by hand. */
function Blank({ rows, columns }: { rows: number; columns: number }) {
  return Array.from({ length: rows }, (_, i) => (
    <tr key={`blank-${i}`} className="blank">
      {Array.from({ length: columns }, (_, j) => (
        <td key={j} />
      ))}
    </tr>
  ))
}

function SkillBox({ title, rows, minRows, className }: { title: string; rows: SkillRow[]; minRows: number; className?: string }) {
  return (
    <Box title={title} className={className}>
      <table className="sheet-table" aria-label={title}>
        <thead>
          <tr>
            <th>Skill</th>
            <th>Base</th>
            <th className="num">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.key}</td>
              <td className="formula">{formula(r)}</td>
              <td className="num">{r.total}</td>
            </tr>
          ))}
          <Blank rows={Math.max(0, minRows - rows.length)} columns={3} />
        </tbody>
      </table>
    </Box>
  )
}

export function CharacterSheet({ character, derived }: { character: Character; derived: DerivedCharacter }) {
  const { concept, attributes: hw } = character
  const c = derived.characteristics
  const a = derived.attributes
  const skills = sheetSkills(derived.skills)
  const styles = heldCombatStyles(skillChoices(character))
  const total = (key: string) => derived.skills.find((r) => r.key === key)?.total ?? ''
  const notes = backgroundNotes(character, derived)
  const nativeTongue = character.culture?.nativeTongue.trim()

  const attributeRows: [string, ReactNode][] = a
    ? [
        ['Action Points', a.actionPoints],
        ['Damage Modifier', a.damageModifier],
        ['Experience Modifier', signed(a.experienceModifier)],
        ['Healing Rate', a.healingRate],
        ['Initiative Bonus', a.initiative],
        ['Luck Points', a.luckPoints],
        ['Movement Rate', `${a.movement} m`],
      ]
    : []

  return (
    <div className="sheet">
      <div className="sheet-page">
        <div className="sheet-main">
          <Box title="Character" className="identity">
            <Field label="Character Name" value={concept.name} wide />
            <Field label="Player Name" value={concept.player} />
            <Field label="Culture" value={character.culture ? `Human, ${CULTURES[character.culture.culture].name}` : ''} />
            <Field label="Gender" value={concept.gender} />
            <Field label="Frame" value={hw.frame ? hw.frame[0].toUpperCase() + hw.frame.slice(1) : ''} />
            <Field label="Homeland" value="" />
            <Field label="Age" value={concept.age ?? ''} />
            <Field label="Height" value={hw.heightCm === null ? '' : `${hw.heightCm} cm`} />
            <Field label="Career" value={character.career ? CAREERS[character.career.career].name : ''} />
            <Field label="Handedness" value={concept.handedness} />
            <Field label="Weight" value={hw.weightKg === null ? '' : `${hw.weightKg} kg`} />
            <Field label="Social Class" value={derived.socialClass?.name ?? ''} />
            <Field label="Description" value={concept.description} wide />
          </Box>

          <Box title="Notes (Background, Culture, Family)" className="notes">
            <ul>
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </Box>

          <Box title="Characteristics and Attributes" className="characteristics">
            <dl className="sheet-stats">
              {CHARACTERISTICS.map((k) => (
                <div key={k}>
                  <dt>{CHARACTERISTIC_NAMES[k]}</dt>
                  <dd>{c?.[k] ?? ''}</dd>
                </div>
              ))}
            </dl>
            <dl className="sheet-stats attributes">
              {attributeRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Box>

          <div className="sheet-columns">
            <div>
              <SkillBox title="Standard Skills" rows={skills.standard} minRows={0} />
              <SkillBox title="Resistances" rows={skills.resistances} minRows={0} />
            </div>
            <div>
              <SkillBox title="Professional Skills" rows={skills.professional} minRows={12} />
              <SkillBox
                title="Languages"
                rows={skills.languages.map((r) => (r.skill === 'Native Tongue' && nativeTongue ? { ...r, key: `Native Tongue (${nativeTongue})` } : r))}
                minRows={4}
              />
            </div>
          </div>
        </div>

        <div className="sheet-side">
          <p className="sheet-name">Mythras</p>
          <Box title="Experience Rolls" className="write-in" />
          <Box title="Money and Wealth">
            <p>{derived.money === null ? '' : `Starting money: ${derived.money} SP`}</p>
          </Box>
          <Box title="Magic Points">
            <p className="sheet-big">{a?.magicPoints ?? ''}</p>
          </Box>
          <SkillBox title="Magical Skills" rows={skills.magic} minRows={6} />
          <Box title="Passions">
            <table className="sheet-table" aria-label="Passions">
              <thead>
                <tr>
                  <th>Passion</th>
                  <th className="num">%</th>
                </tr>
              </thead>
              <tbody>
                {derived.passions.map(({ passion, value }, i) => (
                  <tr key={i}>
                    <td>
                      {passion.verb} ({passion.subject})
                    </td>
                    <td className="num">{value ?? ''}</td>
                  </tr>
                ))}
                <Blank rows={Math.max(0, 8 - derived.passions.length)} columns={2} />
              </tbody>
            </table>
          </Box>
        </div>
      </div>

      <div className="sheet-page page-two">
        <Box title="Magic and Abilities" className="write-in tall" />

        <div className="sheet-columns three">
          <Box title="Hit Locations">
            <table className="sheet-table" aria-label="Hit Locations">
              <thead>
                <tr>
                  <th>d20</th>
                  <th>Location</th>
                  <th className="num">Max HP</th>
                  <th className="num">HP</th>
                </tr>
              </thead>
              <tbody>
                {[...HIT_LOCATIONS].reverse().map((l) => (
                  <tr key={l.location}>
                    <td>{l.min === l.max ? l.min : `${l.min}-${l.max}`}</td>
                    <td>{l.name}</td>
                    <td className="num">{a?.hitPoints[l.location] ?? ''}</td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="sheet-label">Wounds:</p>
          </Box>
          <Box title="Armour">
            <table className="sheet-table" aria-label="Armour">
              <thead>
                <tr>
                  <th>Armour Worn</th>
                  <th className="num">AP</th>
                  <th className="num">ENC</th>
                </tr>
              </thead>
              <tbody>
                <Blank rows={10} columns={3} />
              </tbody>
            </table>
          </Box>
          <Box title="Equipment">
            <table className="sheet-table" aria-label="Equipment">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">ENC</th>
                </tr>
              </thead>
              <tbody>
                <Blank rows={12} columns={2} />
              </tbody>
            </table>
          </Box>
        </div>

        <Box title="Combat Styles">
          <table className="sheet-table" aria-label="Combat Styles">
            <thead>
              <tr>
                <th>Style</th>
                <th>Weapons</th>
                <th>Trait</th>
                <th className="num">%</th>
              </tr>
            </thead>
            <tbody>
              {styles.map((s) => (
                <tr key={styleKey(s)}>
                  <td>{s.name}</td>
                  <td>{s.weapons}</td>
                  <td>{s.trait ?? ''}</td>
                  <td className="num">{total(styleKey(s))}</td>
                </tr>
              ))}
              <Blank rows={Math.max(0, 3 - styles.length)} columns={4} />
              <tr>
                <td>Unarmed</td>
                <td />
                <td />
                <td className="num">{total('Unarmed')}</td>
              </tr>
            </tbody>
          </table>
        </Box>

        <Box title="Weapons and Shields">
          <table className="sheet-table" aria-label="Weapons and Shields">
            <thead>
              <tr>
                <th>Weapon</th>
                <th>Damage</th>
                <th>Size or Force</th>
                <th>Reach or Range</th>
                <th>Combat Effects</th>
                <th className="num">AP</th>
                <th className="num">HP</th>
                <th className="num">ENC</th>
              </tr>
            </thead>
            <tbody>
              <Blank rows={14} columns={8} />
            </tbody>
          </table>
        </Box>
      </div>
    </div>
  )
}
