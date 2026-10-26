import { useState, type ComponentType } from 'react'
import type { StepId } from '../state/derive.ts'
import { useCharacter } from '../state/useCharacter.ts'
import { Problems } from './shared/Problems.tsx'
import { AttributesStep } from './steps/AttributesStep.tsx'
import { BackgroundStep } from './steps/BackgroundStep.tsx'
import { CharacteristicsStep } from './steps/CharacteristicsStep.tsx'
import { ConceptStep } from './steps/ConceptStep.tsx'
import { CultureStep } from './steps/CultureStep.tsx'
import type { StepProps } from './steps/types.ts'
import { SummaryPanel } from './SummaryPanel.tsx'
import { isReachable, STEP_LABELS, visibleSteps } from './wizard.ts'

const STEP_COMPONENTS: Partial<Record<StepId, ComponentType<StepProps>>> = {
  concept: ConceptStep,
  characteristics: CharacteristicsStep,
  attributes: AttributesStep,
  culture: CultureStep,
  background: BackgroundStep,
}

export default function App() {
  const { character, derived, dispatch } = useCharacter()
  const [current, setCurrent] = useState<StepId>('concept')
  const steps = visibleSteps(derived)
  // If the current step stops applying (Ageing after the age is lowered), fall back to the first step.
  const step = steps.includes(current) ? current : steps[0]
  const index = steps.indexOf(step)
  const Step = STEP_COMPONENTS[step]
  const next = steps[index + 1]

  return (
    <>
      <header className="app-header">
        <h1>Mythras Character Generator</h1>
      </header>
      <div className="layout">
        <nav className="panel step-nav" aria-label="Creation steps">
          <ol className="step-list">
            {steps.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  aria-current={s === step ? 'step' : undefined}
                  disabled={!isReachable(s, derived)}
                  onClick={() => setCurrent(s)}
                >
                  <span className="step-label">
                    {i + 1}. {STEP_LABELS[s]}
                  </span>
                  <span className={`step-mark${derived.steps[s].complete ? ' done' : ''}`}>
                    {derived.steps[s].complete ? 'Done' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="panel">
          {Step ? (
            <Step character={character} derived={derived} dispatch={dispatch} />
          ) : (
            <h2>{STEP_LABELS[step]}</h2>
          )}
          <Problems status={derived.steps[step]} />
          <div className="step-footer">
            <button type="button" className="button secondary" disabled={index === 0} onClick={() => setCurrent(steps[index - 1])}>
              Back
            </button>
            {next && (
              <button type="button" className="button" disabled={!derived.steps[step].complete} onClick={() => setCurrent(next)}>
                Next: {STEP_LABELS[next]}
              </button>
            )}
          </div>
        </main>

        <SummaryPanel character={character} derived={derived} step={step} />
      </div>
    </>
  )
}
