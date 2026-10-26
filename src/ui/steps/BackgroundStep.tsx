import { BACKGROUND_EVENTS } from '../../data/backgroundEvents.ts'
import { CULTURES } from '../../data/cultures.ts'
import { CONNECTIONS, EXTENDED_FAMILY, PARENTS, REPUTATION, SIBLINGS, type ConnectionKind, type ExtendedFamily } from '../../data/family.ts'
import { SOCIAL_CLASSES } from '../../data/socialClass.ts'
import { childAgeDice, maritalStatus, rollBackgroundEvent, rollBackgroundEvents, rollChildren, rollPeople } from '../../engine/background.ts'
import { ageCategory } from '../../engine/bonus.ts'
import { diceRange, lookupRow, rollD100 } from '../../engine/dice.ts'
import type { Character } from '../../state/character.ts'
import { CountField } from '../shared/CountField.tsx'
import { NumberInput } from '../shared/NumberInput.tsx'
import { PassionTable } from '../shared/PassionTable.tsx'
import { TableRoll } from '../shared/TableRoll.tsx'
import type { StepProps } from './types.ts'

type Background = Character['background']

const KINDS: ConnectionKind[] = ['Ally', 'Contact', 'Enemy', 'Rival']
const EXTENDED: { key: keyof ExtendedFamily; label: string }[] = [
  { key: 'grandparents', label: 'Grandparents' },
  { key: 'auntsAndUncles', label: 'Aunts and uncles' },
  { key: 'cousins', label: 'Cousins' },
]
const MARITAL_TEXT = { married: 'Married', betrothed: 'Betrothed', unmarried: 'Unmarried' }

const describeExtended = (e: ExtendedFamily) =>
  e.grandparents === null ? 'No extended family' : EXTENDED.map(({ key, label }) => `${label} ${e[key]}`).join(', ')

/** Replaces item `i` of a list, or appends when `i` is the next free slot; null removes it. */
const setAt = <T,>(list: T[], i: number, value: T | null): T[] =>
  value === null ? list.filter((_, j) => j !== i) : i < list.length ? list.map((v, j) => (j === i ? value : v)) : [...list, value]

export function BackgroundStep({ character, derived, dispatch }: StepProps) {
  if (!character.culture) {
    return (
      <>
        <h2>Background</h2>
        <p>Choose a culture first.</p>
      </>
    )
  }
  const b = character.background
  const culture = CULTURES[character.culture.culture]
  const set = (changes: Partial<Background>) => dispatch({ type: 'setBackground', changes })
  const { socialClass, money } = derived
  const culturePassions = character.culture.passions.length
  const siblingsDice = b.siblingsRoll === null ? null : lookupRow(SIBLINGS, b.siblingsRoll)

  return (
    <>
      <h2>Background</h2>
      <p className="hint">
        Social class, starting money and background events are needed; family, connections and marriage are optional. See Mythras pp.
        17-25.
      </p>

      <TableRoll
        legend="Social Class"
        rows={SOCIAL_CLASSES[culture.id]}
        value={b.socialClassRoll}
        describe={(s) => s.name}
        onChange={(socialClassRoll) => set({ socialClassRoll })}
      >
        {socialClass && (
          <p className="hint">
            {socialClass.exampleTitles.join(', ')}. Money Modifier ×{socialClass.moneyModifier}. {socialClass.resources}.
          </p>
        )}
      </TableRoll>

      <fieldset>
        <legend>Starting Money</legend>
        <CountField label={culture.startingMoney.dice} dice={culture.startingMoney.dice} value={b.moneyRoll} onChange={(moneyRoll) => set({ moneyRoll })} />
        <p className="hint">
          {culture.startingMoney.dice} × {culture.startingMoney.multiplier} SP for a {culture.name} character, times the Money Modifier
          {money !== null && <strong>: {money} SP</strong>}
        </p>
      </fieldset>

      <BackgroundEvents character={character} set={set} />

      <h3>Family</h3>
      <TableRoll legend="Parents" rows={PARENTS} value={b.parentsRoll} describe={(p) => p} onChange={(parentsRoll) => set({ parentsRoll })} />
      <TableRoll
        legend="Siblings"
        rows={SIBLINGS}
        value={b.siblingsRoll}
        describe={(d) => (d ? `${d} siblings` : 'No siblings')}
        onChange={(siblingsRoll) => set({ siblingsRoll })}
      >
        {siblingsDice && <CountField label="Siblings" dice={siblingsDice} value={b.siblings} onChange={(siblings) => set({ siblings })} />}
      </TableRoll>
      <TableRoll
        legend="Extended Family"
        rows={EXTENDED_FAMILY}
        value={b.extendedFamilyRoll}
        describe={describeExtended}
        onChange={(extendedFamilyRoll) => set({ extendedFamilyRoll })}
      >
        {b.extendedFamilyRoll !== null &&
          EXTENDED.map(({ key, label }) => {
            const dice = lookupRow(EXTENDED_FAMILY, b.extendedFamilyRoll!)[key]
            return dice && <CountField key={key} label={label} dice={dice} value={b[key]} onChange={(v) => set({ [key]: v })} />
          })}
      </TableRoll>

      <h3>Reputation and Connections</h3>
      <TableRoll
        legend="Reputation"
        rows={REPUTATION}
        value={b.reputationRoll}
        describe={(r) => (r.connections ? `${r.summary}; ${r.connections.count} ${r.connections.kinds.join(' or ')}` : r.summary)}
        onChange={(reputationRoll) => set({ reputationRoll })}
      />
      <TableRoll
        legend="Connections"
        rows={CONNECTIONS}
        value={b.connectionsRoll}
        describe={(c) => (c.rolls ? `${c.summary}; ${c.rolls} roll${c.rolls === 1 ? '' : 's'} for Allies, Contacts, Enemies and Rivals` : c.summary)}
        onChange={(connectionsRoll) => set({ connectionsRoll })}
      />
      <People people={b.people} set={set} canRoll={b.reputationRoll !== null || b.connectionsRoll !== null} roll={() => rollPeople(b.reputationRoll, b.connectionsRoll, Math.random)} />

      <Marriage character={character} set={set} />

      <h3>Other Passions</h3>
      <p className="hint">Add any Passion a background event or family member suggests; see Mythras p. 23.</p>
      {b.passions.length > 0 && (
        <PassionTable
          label="Other Passions"
          editable
          passions={derived.passions.slice(culturePassions)}
          characteristics={derived.characteristics}
          onChange={(passions) => set({ passions })}
        />
      )}
      <button type="button" className="button secondary" onClick={() => set({ passions: [...b.passions, { verb: '', subject: '', object: null }] })}>
        Add a Passion
      </button>
    </>
  )
}

type SectionProps = { character: Character; set: (changes: Partial<Background>) => void }

function BackgroundEvents({ character, set }: SectionProps) {
  const { events } = character.background
  const count = ageCategory(character.concept.ageCategory).backgroundEvents
  if (count === 0) {
    return (
      <>
        <h3>Background Events</h3>
        <p>Young characters have no background events.</p>
      </>
    )
  }
  const slots = Array.from({ length: Math.min(count, events.length + 1) }, (_, i) => i)
  return (
    <>
      <h3>Background Events</h3>
      <p className="hint">
        {count} event{count === 1 ? '' : 's'} for this age category; a repeated event is rolled again. See Mythras pp. 17-20.
      </p>
      <button type="button" className="button secondary" onClick={() => set({ events: rollBackgroundEvents(character.concept.ageCategory, Math.random) })}>
        Roll all events
      </button>
      {slots.map((i) => (
        <TableRoll
          key={i}
          legend={`Background Event ${i + 1}`}
          rows={BACKGROUND_EVENTS}
          value={events[i] ?? null}
          describe={(e) => e}
          roll={() => rollBackgroundEvent(events.filter((_, j) => j !== i), Math.random)}
          onChange={(d100) => set({ events: setAt(events, i, d100) })}
        />
      ))}
    </>
  )
}

function People({ people, set, canRoll, roll }: { people: Background['people']; set: SectionProps['set']; canRoll: boolean; roll: () => ConnectionKind[] }) {
  return (
    <fieldset>
      <legend>Allies, Contacts, Enemies and Rivals</legend>
      <p className="hint">Rolling replaces the list. Relabel an "or" result as either kind, and name each person.</p>
      {people.map((p, i) => (
        <div className="inline row-gap" key={i}>
          <select aria-label={`Person ${i + 1} kind`} value={p.kind} onChange={(e) => set({ people: setAt(people, i, { ...p, kind: e.target.value as ConnectionKind }) })}>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <input type="text" aria-label={`Person ${i + 1} name`} value={p.name} onChange={(e) => set({ people: setAt(people, i, { ...p, name: e.target.value }) })} />
          <button type="button" className="button secondary" onClick={() => set({ people: setAt(people, i, null) })}>
            Remove
          </button>
        </div>
      ))}
      <div className="inline">
        <button type="button" className="button secondary" disabled={!canRoll} onClick={() => set({ people: roll().map((kind) => ({ kind, name: '' })) })}>
          Roll from reputation and connections
        </button>
        <button type="button" className="button secondary" onClick={() => set({ people: [...people, { kind: 'Ally', name: '' }] })}>
          Add person
        </button>
      </div>
    </fieldset>
  )
}

function Marriage({ character, set }: SectionProps) {
  const { marriageRoll, children } = character.background
  const values = character.characteristics.values
  const status = marriageRoll !== null && values ? maritalStatus(marriageRoll, values) : null
  const parent = character.concept.ageCategory
  return (
    <fieldset>
      <legend>Marriage</legend>
      <p className="hint">Roll against base Influence: at or under a tenth of it, married; at or under it, betrothed. See Mythras p. 23.</p>
      <div className="inline">
        <label className="choice">
          d100
          <NumberInput min={1} max={100} value={marriageRoll} onChange={(v) => set({ marriageRoll: v !== null && v >= 1 && v <= 100 ? v : null })} />
        </label>
        <button type="button" className="button secondary" onClick={() => set({ marriageRoll: rollD100(Math.random) })}>
          Roll d100
        </button>
        {status && <strong>{MARITAL_TEXT[status]}</strong>}
      </div>
      {status === 'married' && (
        <>
          <h4>Children</h4>
          {children.map((age, i) => (
            <div className="inline row-gap" key={i}>
              <label className="choice">
                Child {i + 1} age
                <NumberInput value={age} onChange={(v) => v !== null && set({ children: setAt(children, i, v) })} />
              </label>
              <button type="button" className="button secondary" onClick={() => set({ children: setAt(children, i, null) })}>
                Remove
              </button>
            </div>
          ))}
          <div className="inline">
            <button type="button" className="button secondary" onClick={() => set({ children: rollChildren(parent, Math.random) })}>
              Roll children
            </button>
            <button type="button" className="button secondary" onClick={() => set({ children: [...children, diceRange(childAgeDice(parent)).min] })}>
              Add child
            </button>
          </div>
        </>
      )}
    </fieldset>
  )
}
