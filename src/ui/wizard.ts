import { STEPS, type DerivedCharacter, type StepId } from '../state/derive.ts'

export const STEP_LABELS: Record<StepId, string> = {
  concept: 'Concept',
  characteristics: 'Characteristics',
  attributes: 'Attributes',
  culture: 'Culture',
  background: 'Background',
  career: 'Career',
  bonus: 'Bonus Skills',
  ageing: 'Ageing',
}

/** The steps this character goes through; Ageing only from age 40 (R17). */
export function visibleSteps(derived: DerivedCharacter): StepId[] {
  return STEPS.filter((s) => derived.steps[s].applies)
}

const STEP_KEY = 'mythras-chargen:step'

/** The step the player was on, so a page refresh returns there. It is UI state, not part of the character. */
export function loadStep(storage: Storage = localStorage): StepId {
  const saved = storage.getItem(STEP_KEY)
  return STEPS.find((s) => s === saved) ?? 'concept'
}

export function saveStep(step: StepId, storage: Storage = localStorage): void {
  storage.setItem(STEP_KEY, step)
}

/** A step can be opened once every step before it is complete. */
export function isReachable(step: StepId, derived: DerivedCharacter): boolean {
  const steps = visibleSteps(derived)
  return steps.slice(0, steps.indexOf(step)).every((s) => derived.steps[s].complete)
}
