import { STEPS, type DerivedCharacter, type StepId } from '../state/derive.ts'

/** A creation step, or the finished character sheet after the last one. */
export type View = StepId | 'sheet'

export const VIEW_LABELS: Record<View, string> = {
  concept: 'Concept',
  characteristics: 'Characteristics',
  attributes: 'Attributes',
  culture: 'Culture',
  background: 'Background',
  career: 'Career',
  bonus: 'Bonus Skills',
  ageing: 'Ageing',
  sheet: 'Character Sheet',
}

/** The steps this character goes through; Ageing only from age 40 (R17). */
export function visibleSteps(derived: DerivedCharacter): StepId[] {
  return STEPS.filter((s) => derived.steps[s].applies)
}

export function visibleViews(derived: DerivedCharacter): View[] {
  return [...visibleSteps(derived), 'sheet']
}

const VIEW_KEY = 'mythras-chargen:step'

/** The view the player was on, so a page refresh returns there. It is UI state, not part of the character. */
export function loadView(storage: Storage = localStorage): View {
  const saved = storage.getItem(VIEW_KEY)
  return [...STEPS, 'sheet' as const].find((v) => v === saved) ?? 'concept'
}

export function saveView(view: View, storage: Storage = localStorage): void {
  storage.setItem(VIEW_KEY, view)
}

/** A view can be opened once every step before it is complete; the sheet once all are. */
export function isReachable(view: View, derived: DerivedCharacter): boolean {
  const steps = visibleSteps(derived)
  const before = view === 'sheet' ? steps : steps.slice(0, steps.indexOf(view))
  return before.every((s) => derived.steps[s].complete)
}
