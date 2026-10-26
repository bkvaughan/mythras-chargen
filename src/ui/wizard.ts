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

/** A step can be opened once every step before it is complete. */
export function isReachable(step: StepId, derived: DerivedCharacter): boolean {
  const steps = visibleSteps(derived)
  return steps.slice(0, steps.indexOf(step)).every((s) => derived.steps[s].complete)
}
